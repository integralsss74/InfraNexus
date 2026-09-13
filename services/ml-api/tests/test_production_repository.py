from contextlib import contextmanager

from app import production_repository


class CursorStub:
    def __init__(self):
        self.calls: list[tuple[str, list[object]]] = []

    def execute(self, query, params):
        self.calls.append((query, params))

    def fetchall(self):
        return []


class ConnectionStub:
    def __init__(self, cursor):
        self.cursor_stub = cursor

    @contextmanager
    def cursor(self):
        yield self.cursor_stub


def test_repository_project_and_coordinate_queries_use_project_and_latest_prediction_aliases(monkeypatch):
    cursor = CursorStub()

    @contextmanager
    def connection_stub():
        yield ConnectionStub(cursor)

    monkeypatch.setattr(production_repository, "_connection", connection_stub)
    repository = production_repository.ProductionRepository()
    assert repository.list_projects(limit=20, offset=0, risk="High") == []
    assert repository.coordinates(risk="Critical") == []

    project_query, project_params = cursor.calls[0]
    coordinate_query, coordinate_params = cursor.calls[1]
    assert "project.project_name" in project_query
    assert "latest_prediction.risk_category" in project_query
    assert "p.project_name" not in project_query
    assert project_params == ["High", 20, 0]
    assert "prediction.project_id = project.project_id" in coordinate_query
    assert "latest_prediction.risk_score" in coordinate_query
    assert coordinate_params == ["Critical"]
