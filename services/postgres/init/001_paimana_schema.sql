CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE SCHEMA IF NOT EXISTS paimana;

CREATE TABLE IF NOT EXISTS paimana.projects (
  project_id TEXT PRIMARY KEY,
  project_name TEXT NOT NULL,
  sector TEXT NOT NULL,
  ministry TEXT,
  state TEXT,
  implementing_agency TEXT,
  source_type TEXT NOT NULL DEFAULT 'synthetic',
  is_synthetic BOOLEAN NOT NULL DEFAULT TRUE,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS paimana.monthly_project_updates (
  id BIGSERIAL PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES paimana.projects(project_id),
  observed_month DATE NOT NULL,
  physical_progress NUMERIC(5,2),
  financial_progress NUMERIC(5,2),
  planned_progress NUMERIC(5,2),
  risk_score NUMERIC(5,2),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE(project_id, observed_month)
);

CREATE TABLE IF NOT EXISTS paimana.predictions (
  id BIGSERIAL PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES paimana.projects(project_id),
  model_version TEXT NOT NULL,
  risk_score NUMERIC(5,2) NOT NULL,
  risk_category TEXT NOT NULL,
  payload JSONB NOT NULL,
  is_synthetic BOOLEAN NOT NULL DEFAULT TRUE,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS paimana.alerts (
  id BIGSERIAL PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES paimana.projects(project_id),
  severity TEXT NOT NULL,
  alert_type TEXT NOT NULL,
  trigger_evidence JSONB NOT NULL DEFAULT '{}'::jsonb,
  threshold TEXT,
  recommended_action TEXT,
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS paimana.shap_attributions (
  id BIGSERIAL PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES paimana.projects(project_id),
  model_version TEXT NOT NULL,
  base_value NUMERIC,
  feature_name TEXT NOT NULL,
  feature_value TEXT,
  contribution NUMERIC NOT NULL,
  direction TEXT NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS paimana.production_import_archives (
  id BIGSERIAL PRIMARY KEY,
  owner_open_id TEXT NOT NULL,
  storage_key TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  checksum TEXT,
  record_count INTEGER,
  source_worksheet TEXT,
  header_summary JSONB NOT NULL DEFAULT '[]'::jsonb,
  imported_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS paimana.intervention_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT NOT NULL REFERENCES paimana.projects(project_id),
  status TEXT NOT NULL DEFAULT 'New',
  owner_open_id TEXT,
  due_at TIMESTAMPTZ,
  response_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS paimana.intervention_events (
  id BIGSERIAL PRIMARY KEY,
  intervention_id UUID NOT NULL REFERENCES paimana.intervention_cases(id),
  actor_open_id TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  action TEXT NOT NULL,
  detail JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS paimana.authorized_project_coordinates (
  id BIGSERIAL PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES paimana.projects(project_id),
  source_name TEXT NOT NULL,
  authority_reference TEXT NOT NULL,
  precision TEXT NOT NULL CHECK (precision IN ('district', 'project')),
  consent_confirmed BOOLEAN NOT NULL,
  location GEOGRAPHY(POINT, 4326) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  superseded_at TIMESTAMPTZ,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS authorized_project_coordinates_active_gix
  ON paimana.authorized_project_coordinates USING GIST (location) WHERE is_active;
CREATE INDEX IF NOT EXISTS predictions_project_generated_idx ON paimana.predictions(project_id, generated_at DESC);
CREATE INDEX IF NOT EXISTS alerts_project_created_idx ON paimana.alerts(project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS intervention_events_case_created_idx ON paimana.intervention_events(intervention_id, created_at DESC);
