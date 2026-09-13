import time

from fastapi.testclient import TestClient

from app import main
from app.gateway import create_assertion
from app.main import app


client = TestClient(app)
payload = {
    "project_id": "P-0004",
    "sector": "Water & Sanitation",
    "approved_cost": 12300,
    "physical_progress": 38,
    "financial_progress": 81,
    "planned_progress": 73,
    "milestones_delayed": 6,
    "extensions": 3,
    "duration_utilization": 83,
    "clearance_status": "Pending",
    "contractor_status": "Under review",
    "expenditure_ratio": 81,
    "risk_acceleration": 24,
}


def test_health_and_model_card_are_available():
    health = client.get("/health")
    card = client.get("/v1/model-card")
    evidence = client.get("/v1/model-evidence")
    assert health.status_code == 200
    assert health.json()["datasetLabel"] == "Synthetic Demonstration Dataset"
    assert card.status_code == 200
    assert "costOverrunPercentage" in card.json()["metrics"]
    assert "XGBoost challenger" in card.json()["models"]
    assert evidence.status_code == 200
    assert evidence.json()["rocCurve"]["auc"] > 0.5
    assert evidence.json()["confusionMatrix"]["matrix"]


def test_predict_and_explain_return_governed_outputs():
    response = client.post("/v1/predict", json=payload)
    details = client.post("/v1/explain", json=payload)
    assert response.status_code == 200
    assert response.json()["overallRisk"] > 50
    assert response.json()["datasetLabel"] == "Synthetic Demonstration Dataset"
    assert details.status_code == 200
    assert details.json()["positiveContributors"]
    assert details.json()["method"] == "TreeSHAP"
    assert details.json()["explanationAvailable"] is True
    assert isinstance(details.json()["baseValue"], float)
    assert isinstance(details.json()["predictedOutput"], float)
    assert details.json()["signedContributions"]
    assert abs(details.json()["additivityResidual"]) < 0.001
    assert "not an official" in details.json()["disclaimer"]


def test_gateway_verification_and_unconfigured_production_stack_are_explicit(monkeypatch):
    secret = "p" * 32
    monkeypatch.setenv("PAIMANA_PRODUCTION_GATEWAY_SECRET", secret)
    assertion = create_assertion(user_id=17, open_id="gateway-test", role="admin", secret=secret, now=int(time.time()))
    verified = client.get("/auth/verify", headers={"X-PAIMANA-Assertion": assertion})
    assert verified.status_code == 200
    assert verified.json()["role"] == "admin"

    monkeypatch.delenv("PAIMANA_POSTGRES_URL", raising=False)
    overview = client.get("/portfolio")
    assert overview.status_code == 503
    assert "optional production stack" in overview.json()["detail"]


def test_production_endpoints_require_signed_roles_and_return_repository_records(monkeypatch):
    class RepositoryStub:
        def project(self, project_id):
            return {"project_id": project_id, "project_name": "Authorised Corridor", "source_type": "imported"}

        def publish_coordinate(self, payload, actor_open_id):
            return {"id": 7, "project_id": payload["projectId"], "created_by": actor_open_id}

        def update_workflow_status(self, workflow_id, status, actor_open_id, actor_role):
            return {"id": workflow_id, "status": status, "actor": actor_open_id, "role": actor_role}

    monkeypatch.setattr(main, "ProductionRepository", RepositoryStub)
    secret = "s" * 32
    monkeypatch.setenv("PAIMANA_PRODUCTION_GATEWAY_SECRET", secret)
    user_assertion = create_assertion(user_id=9, open_id="reviewer", role="user", secret=secret, now=int(time.time()))
    admin_assertion = create_assertion(user_id=10, open_id="administrator", role="admin", secret=secret, now=int(time.time()))
    user_headers = {"X-PAIMANA-Assertion": user_assertion}
    admin_headers = {"X-PAIMANA-Assertion": admin_assertion}

    project = client.get("/projects/P-1001")
    assert project.status_code == 200
    assert project.json()["project_id"] == "P-1001"

    coordinate_payload = {"projectId": "P-1001", "latitude": 19.076, "longitude": 72.878, "precision": "project", "sourceName": "Authorised register", "authorityReference": "AUTH-42", "consentConfirmed": True}
    assert client.post("/coordinates", json=coordinate_payload).status_code == 401
    assert client.post("/coordinates", json=coordinate_payload, headers=user_headers).status_code == 403
    invalid_coordinate = {**coordinate_payload, "latitude": 91}
    assert client.post("/coordinates", json=invalid_coordinate, headers=admin_headers).status_code == 422
    published = client.post("/coordinates", json=coordinate_payload, headers=admin_headers)
    assert published.status_code == 200
    assert published.json()["created_by"] == "administrator"

    assert client.post("/workflows/wf-1/status", json={"status": "Under review"}, headers=user_headers).status_code == 403
    status_update = client.post("/workflows/wf-1/status", json={"status": "Under review"}, headers=admin_headers)
    assert status_update.status_code == 200
    assert status_update.json()["status"] == "Under review"
