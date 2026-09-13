"""Optional Postgres/PostGIS repository for the additive PAIMANA production stack.

This module intentionally has no in-memory write fallback: a missing production
database yields a clear unavailable state rather than fabricated audit history,
workflow, imports, or authorised coordinates.
"""
from __future__ import annotations

import json
import os
from contextlib import contextmanager
from typing import Any, Iterator

import psycopg
from psycopg.rows import dict_row


class ProductionRepositoryUnavailable(RuntimeError):
    pass


def _dsn() -> str:
    dsn = os.getenv("PAIMANA_POSTGRES_URL")
    if not dsn:
        raise ProductionRepositoryUnavailable("PAIMANA_POSTGRES_URL is not configured; the managed synthetic demo remains available without the optional production stack")
    return dsn


@contextmanager
def _connection() -> Iterator[psycopg.Connection]:
    try:
        with psycopg.connect(_dsn(), row_factory=dict_row) as connection:
            yield connection
    except ProductionRepositoryUnavailable:
        raise
    except psycopg.Error as error:
        raise ProductionRepositoryUnavailable("The optional PAIMANA PostGIS database is unavailable") from error


class ProductionRepository:
    def overview(self) -> dict[str, Any]:
        with _connection() as connection, connection.cursor() as cursor:
            cursor.execute("""
                SELECT COUNT(*)::int AS projects, COALESCE(AVG(risk_score), 0)::float AS average_risk,
                       COUNT(*) FILTER (WHERE risk_category IN ('High', 'Critical'))::int AS high_review_band
                FROM paimana.predictions
                WHERE generated_at = (SELECT MAX(generated_at) FROM paimana.predictions)
            """)
            result = cursor.fetchone() or {"projects": 0, "average_risk": 0, "high_review_band": 0}
            return {**result, "datasetLabel": "Production database records may be synthetic or imported; inspect sourceType per project."}

    def list_projects(self, limit: int, offset: int, risk: str | None = None) -> list[dict[str, Any]]:
        where = "WHERE latest_prediction.risk_category = %s" if risk else ""
        params: list[Any] = [risk] if risk else []
        params.extend([limit, offset])
        with _connection() as connection, connection.cursor() as cursor:
            cursor.execute(f"""
                SELECT project.project_id, project.project_name, project.sector, project.ministry, project.state, project.implementing_agency,
                       project.source_type, project.is_synthetic, latest_prediction.risk_score, latest_prediction.risk_category, latest_prediction.generated_at
                FROM (
                  SELECT DISTINCT ON (project_id) project_id, risk_score, risk_category, generated_at
                  FROM paimana.predictions ORDER BY project_id, generated_at DESC
                ) latest_prediction
                JOIN paimana.projects project ON project.project_id = latest_prediction.project_id
                {where}
                ORDER BY latest_prediction.risk_score DESC, project.project_id ASC LIMIT %s OFFSET %s
            """, params)
            return [dict(row) for row in cursor.fetchall()]

    def project(self, project_id: str) -> dict[str, Any] | None:
        with _connection() as connection, connection.cursor() as cursor:
            cursor.execute("SELECT * FROM paimana.projects WHERE project_id = %s", [project_id])
            record = cursor.fetchone()
            return dict(record) if record else None

    def project_predictions(self, project_id: str) -> list[dict[str, Any]]:
        return self._list_for_project("paimana.predictions", project_id, "generated_at")

    def project_alerts(self, project_id: str) -> list[dict[str, Any]]:
        return self._list_for_project("paimana.alerts", project_id, "created_at")

    def project_explanation(self, project_id: str) -> list[dict[str, Any]]:
        return self._list_for_project("paimana.shap_attributions", project_id, "generated_at")

    def _list_for_project(self, table: str, project_id: str, ordering: str) -> list[dict[str, Any]]:
        with _connection() as connection, connection.cursor() as cursor:
            cursor.execute(f"SELECT * FROM {table} WHERE project_id = %s ORDER BY {ordering} DESC", [project_id])
            return [dict(row) for row in cursor.fetchall()]

    def workflows(self) -> list[dict[str, Any]]:
        with _connection() as connection, connection.cursor() as cursor:
            cursor.execute("SELECT * FROM paimana.intervention_cases ORDER BY updated_at DESC")
            return [dict(row) for row in cursor.fetchall()]

    def workflow_events(self, workflow_id: str) -> list[dict[str, Any]]:
        with _connection() as connection, connection.cursor() as cursor:
            cursor.execute("SELECT * FROM paimana.intervention_events WHERE intervention_id = %s ORDER BY created_at ASC", [workflow_id])
            return [dict(row) for row in cursor.fetchall()]

    def update_workflow_status(self, workflow_id: str, status: str, actor_open_id: str, actor_role: str) -> dict[str, Any]:
        allowed = {"New", "Awaiting agency", "Response received", "Under review", "Intervention approved", "Closed"}
        if status not in allowed:
            raise ValueError("Unsupported workflow status")
        with _connection() as connection, connection.cursor() as cursor:
            cursor.execute("UPDATE paimana.intervention_cases SET status = %s, updated_at = NOW() WHERE id = %s RETURNING *", [status, workflow_id])
            record = cursor.fetchone()
            if not record:
                raise KeyError("Intervention workflow not found")
            cursor.execute("INSERT INTO paimana.intervention_events (intervention_id, actor_open_id, actor_role, action, detail) VALUES (%s, %s, %s, 'status_updated', %s::jsonb)", [workflow_id, actor_open_id, actor_role, json.dumps({"status": status})])
            connection.commit()
            return dict(record)

    def add_agency_response(self, workflow_id: str, response_text: str, actor_open_id: str, actor_role: str) -> dict[str, Any]:
        with _connection() as connection, connection.cursor() as cursor:
            cursor.execute("UPDATE paimana.intervention_cases SET response_text = %s, status = 'Response received', updated_at = NOW() WHERE id = %s RETURNING *", [response_text, workflow_id])
            record = cursor.fetchone()
            if not record:
                raise KeyError("Intervention workflow not found")
            cursor.execute("INSERT INTO paimana.intervention_events (intervention_id, actor_open_id, actor_role, action, detail) VALUES (%s, %s, %s, 'agency_response_submitted', %s::jsonb)", [workflow_id, actor_open_id, actor_role, json.dumps({"responseLength": len(response_text)})])
            connection.commit()
            return dict(record)

    def imports(self, owner_open_id: str) -> list[dict[str, Any]]:
        with _connection() as connection, connection.cursor() as cursor:
            cursor.execute("SELECT * FROM paimana.production_import_archives WHERE owner_open_id = %s ORDER BY imported_at DESC", [owner_open_id])
            return [dict(row) for row in cursor.fetchall()]

    def record_import(self, payload: dict[str, Any], owner_open_id: str) -> dict[str, Any]:
        with _connection() as connection, connection.cursor() as cursor:
            cursor.execute("""
              INSERT INTO paimana.production_import_archives (owner_open_id, storage_key, original_filename, checksum, record_count, source_worksheet, header_summary)
              VALUES (%s, %s, %s, %s, %s, %s, %s::jsonb) RETURNING *
            """, [owner_open_id, payload["storageKey"], payload["originalFilename"], payload.get("checksum"), payload.get("recordCount"), payload.get("sourceWorksheet"), json.dumps(payload.get("headerSummary", []))])
            record = cursor.fetchone()
            connection.commit()
            return dict(record)

    def coordinates(self, risk: str | None = None) -> list[dict[str, Any]]:
        risk_clause = "AND latest_prediction.risk_category = %s" if risk else ""
        params: list[Any] = [risk] if risk else []
        with _connection() as connection, connection.cursor() as cursor:
            cursor.execute(f"""
              SELECT coordinate.project_id, project.project_name, coordinate.source_name, coordinate.authority_reference, coordinate.precision,
                     ST_Y(coordinate.location::geometry)::float AS latitude, ST_X(coordinate.location::geometry)::float AS longitude,
                     latest_prediction.risk_score::float, latest_prediction.risk_category
              FROM paimana.authorized_project_coordinates coordinate
              JOIN paimana.projects project ON project.project_id = coordinate.project_id
              LEFT JOIN LATERAL (
                SELECT prediction.*
                FROM paimana.predictions prediction
                WHERE prediction.project_id = project.project_id
                ORDER BY prediction.generated_at DESC
                LIMIT 1
              ) latest_prediction ON TRUE
              WHERE coordinate.is_active {risk_clause}
              ORDER BY latest_prediction.risk_score DESC NULLS LAST
            """, params)
            return [dict(row) for row in cursor.fetchall()]

    def publish_coordinate(self, payload: dict[str, Any], actor_open_id: str) -> dict[str, Any]:
        with _connection() as connection, connection.cursor() as cursor:
            cursor.execute("SELECT 1 FROM paimana.projects WHERE project_id = %s", [payload["projectId"]])
            if not cursor.fetchone():
                raise KeyError("Coordinate project_id does not match a registered project")
            cursor.execute("UPDATE paimana.authorized_project_coordinates SET is_active = FALSE, superseded_at = NOW() WHERE project_id = %s AND is_active", [payload["projectId"]])
            cursor.execute("""
              INSERT INTO paimana.authorized_project_coordinates (project_id, source_name, authority_reference, precision, consent_confirmed, location, created_by)
              VALUES (%s, %s, %s, %s, TRUE, ST_SetSRID(ST_MakePoint(%s, %s), 4326)::geography, %s) RETURNING *
            """, [payload["projectId"], payload["sourceName"], payload["authorityReference"], payload["precision"], payload["longitude"], payload["latitude"], actor_open_id])
            record = cursor.fetchone()
            connection.commit()
            return dict(record)
