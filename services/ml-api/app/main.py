from __future__ import annotations

import os
from functools import lru_cache
from typing import Literal

from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from .modeling import CONTRACTOR_SCORES, CLEARANCE_SCORES, DATASET_LABEL, ModelBundle, explanation, load_or_train, model_evidence, prediction, train_bundle
from .gateway import GatewayPrincipal, require_gateway_principal
from .production_repository import ProductionRepository, ProductionRepositoryUnavailable


class PredictionRequest(BaseModel):
    project_id: str | None = Field(default=None, max_length=64)
    sector: str = Field(default="Roads", max_length=64)
    approved_cost: float | None = Field(default=None, ge=0, le=10_000_000)
    physical_progress: float = Field(ge=0, le=100)
    financial_progress: float = Field(ge=0, le=100)
    planned_progress: float = Field(ge=0, le=100)
    milestones_delayed: int = Field(ge=0, le=20)
    extensions: int = Field(ge=0, le=10)
    duration_utilization: float = Field(ge=0, le=200)
    clearance_status: Literal["Cleared", "Conditional", "Pending"] = "Cleared"
    contractor_status: Literal["Stable", "At risk", "Under review"] = "Stable"
    expenditure_ratio: float | None = Field(default=None, ge=0, le=100)
    risk_acceleration: float = Field(default=0, ge=-50, le=100)


class ProductionImportRequest(BaseModel):
    storageKey: str = Field(min_length=3, max_length=512)
    originalFilename: str = Field(min_length=1, max_length=255)
    checksum: str | None = Field(default=None, max_length=128)
    recordCount: int | None = Field(default=None, ge=0)
    sourceWorksheet: str | None = Field(default=None, max_length=255)
    headerSummary: list[str] = Field(default_factory=list, max_length=200)


class WorkflowStatusRequest(BaseModel):
    status: Literal["New", "Awaiting agency", "Response received", "Under review", "Intervention approved", "Closed"]


class AgencyResponseRequest(BaseModel):
    responseText: str = Field(min_length=1, max_length=10000)


class CoordinateRequest(BaseModel):
    projectId: str = Field(min_length=1, max_length=64)
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    precision: Literal["district", "project"]
    sourceName: str = Field(min_length=1, max_length=255)
    authorityReference: str = Field(min_length=1, max_length=255)
    consentConfirmed: Literal[True]


app = FastAPI(
    title="PAIMANA AI ML Sidecar",
    version="1.0.0",
    description="Synthetic-demo FastAPI service for reproducible infrastructure risk models and explainability.",
)
origins = [origin.strip() for origin in os.getenv("ALLOWED_ORIGINS", "*").split(",") if origin.strip()]
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=False, allow_methods=["GET", "POST"], allow_headers=["Content-Type"])


@lru_cache(maxsize=1)
def bundle() -> ModelBundle:
    return load_or_train()


@app.get("/health")
def health() -> dict:
    current = bundle()
    return {"status": "ok", "service": "paimana-ml-sidecar", "modelVersion": current.model_version, "datasetLabel": DATASET_LABEL}


@app.get("/auth/verify")
def verify_gateway(principal: GatewayPrincipal = Depends(require_gateway_principal)) -> dict:
    return {"authenticated": True, "userId": principal.user_id, "role": principal.role, "expiresAt": principal.expires_at}


def production_call(operation):
    try:
        return operation(ProductionRepository())
    except ProductionRepositoryUnavailable as error:
        raise HTTPException(status_code=503, detail=str(error)) from error
    except KeyError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error


@app.get("/portfolio")
@app.get("/analytics/overview")
def production_overview() -> dict:
    return production_call(lambda repository: repository.overview())


@app.get("/projects")
def production_projects(limit: int = Query(default=50, ge=1, le=200), offset: int = Query(default=0, ge=0), risk: str | None = None) -> dict:
    return {"items": production_call(lambda repository: repository.list_projects(limit, offset, risk)), "limit": limit, "offset": offset}


@app.get("/projects/{project_id}")
def production_project(project_id: str) -> dict:
    record = production_call(lambda repository: repository.project(project_id))
    if not record:
        raise HTTPException(status_code=404, detail="Project not found")
    return record


@app.get("/projects/{project_id}/predictions")
def production_predictions(project_id: str) -> dict:
    return {"items": production_call(lambda repository: repository.project_predictions(project_id))}


@app.get("/projects/{project_id}/alerts")
def production_alerts(project_id: str) -> dict:
    return {"items": production_call(lambda repository: repository.project_alerts(project_id))}


@app.get("/projects/{project_id}/explanation")
def production_explanation(project_id: str) -> dict:
    return {"items": production_call(lambda repository: repository.project_explanation(project_id)), "disclaimer": "Attributions are model influence, not causal conclusions."}


@app.get("/imports")
def production_imports(principal: GatewayPrincipal = Depends(require_gateway_principal)) -> dict:
    return {"items": production_call(lambda repository: repository.imports(principal.open_id))}


@app.post("/imports")
def production_import(payload: ProductionImportRequest, principal: GatewayPrincipal = Depends(require_gateway_principal)) -> dict:
    return production_call(lambda repository: repository.record_import(payload.model_dump(), principal.open_id))


@app.get("/workflows")
def production_workflows() -> dict:
    return {"items": production_call(lambda repository: repository.workflows())}


@app.post("/workflows/{workflow_id}/status")
def update_workflow_status(workflow_id: str, payload: WorkflowStatusRequest, principal: GatewayPrincipal = Depends(require_gateway_principal)) -> dict:
    if principal.role != "admin":
        raise HTTPException(status_code=403, detail="Administrator role required for workflow status updates")
    return production_call(lambda repository: repository.update_workflow_status(workflow_id, payload.status, principal.open_id, principal.role))


@app.post("/workflows/{workflow_id}/agency-response")
def add_agency_response(workflow_id: str, payload: AgencyResponseRequest, principal: GatewayPrincipal = Depends(require_gateway_principal)) -> dict:
    return production_call(lambda repository: repository.add_agency_response(workflow_id, payload.responseText, principal.open_id, principal.role))


@app.get("/workflows/{workflow_id}/events")
def production_workflow_events(workflow_id: str, principal: GatewayPrincipal = Depends(require_gateway_principal)) -> dict:
    return {"items": production_call(lambda repository: repository.workflow_events(workflow_id)), "actor": principal.open_id}


@app.get("/coordinates")
def production_coordinates(risk: Literal["High", "Critical"] | None = None) -> dict:
    return {"items": production_call(lambda repository: repository.coordinates(risk)), "policy": "Only active, authorised project coordinates are returned. The absence of coordinates is an intentional governed map state."}


@app.post("/coordinates")
def publish_coordinate(payload: CoordinateRequest, principal: GatewayPrincipal = Depends(require_gateway_principal)) -> dict:
    if principal.role != "admin":
        raise HTTPException(status_code=403, detail="Administrator role required for authorised-coordinate publication")
    return production_call(lambda repository: repository.publish_coordinate(payload.model_dump(), principal.open_id))


@app.get("/v1/model-card")
def model_card() -> dict:
    return bundle().model_card()


@app.get("/v1/model-evidence")
def model_evidence_card() -> dict:
    return model_evidence(bundle())


@app.post("/v1/predict")
def predict(request: PredictionRequest) -> dict:
    return prediction(bundle(), request.model_dump(exclude_none=True))


@app.post("/v1/explain")
def explain(request: PredictionRequest) -> dict:
    return explanation(bundle(), request.model_dump(exclude_none=True))


@app.post("/v1/simulate")
def simulate(request: PredictionRequest) -> dict:
    return prediction(bundle(), request.model_dump(exclude_none=True), simulation=True)


@app.post("/v1/train")
def train() -> dict:
    refreshed = train_bundle()
    from .modeling import artifact_path

    refreshed.save(artifact_path())
    from .modeling import write_artifacts

    write_artifacts(refreshed)
    bundle.cache_clear()
    return {"status": "trained", **refreshed.model_card()}
