-- =============================================
-- Schema DDL -- Digital License Royalty Auditor
-- Migration: rebuild_schema_v2
-- =============================================

-- 1. contracts
CREATE TABLE contracts (
  contract_id   text PRIMARY KEY,
  content_id    text NOT NULL,
  studio        text NOT NULL,
  royalty_rate   float8 NOT NULL,
  rate_per_play  float8 NOT NULL,
  territory     text[] NOT NULL,
  start_date    date NOT NULL,
  end_date      date NOT NULL,
  tier_threshold int4 NOT NULL DEFAULT 100000,
  tier_rate     float8 NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_contracts_content_id ON contracts(content_id);
CREATE INDEX idx_contracts_studio ON contracts(studio);

-- 2. streaming_logs
CREATE TABLE streaming_logs (
  play_id    text PRIMARY KEY,
  content_id text NOT NULL,
  timestamp  timestamptz NOT NULL,
  country    text NOT NULL,
  plays      int4 NOT NULL DEFAULT 1,
  user_type  text NOT NULL CHECK (user_type IN ('free', 'premium', 'trial')),
  device     text NOT NULL CHECK (device IN ('mobile', 'desktop', 'tv', 'tablet'))
);

CREATE INDEX idx_streaming_logs_content_id ON streaming_logs(content_id);
CREATE INDEX idx_streaming_logs_country ON streaming_logs(country);
CREATE INDEX idx_streaming_logs_timestamp ON streaming_logs(timestamp);

-- 3. payment_ledger
CREATE TABLE payment_ledger (
  payment_id   text PRIMARY KEY,
  content_id   text NOT NULL,
  contract_id  text NOT NULL REFERENCES contracts(contract_id),
  amount_paid  float8 NOT NULL,
  payment_date date NOT NULL
);

CREATE INDEX idx_payment_ledger_content_id ON payment_ledger(content_id);
CREATE INDEX idx_payment_ledger_contract_id ON payment_ledger(contract_id);

-- 4. audit_results
CREATE TABLE audit_results (
  audit_id         text PRIMARY KEY,
  contract_id      text NOT NULL REFERENCES contracts(contract_id),
  content_id       text NOT NULL,
  expected_payment float8 NOT NULL,
  actual_payment   float8 NOT NULL,
  difference       float8 NOT NULL,
  violation_type   text CHECK (
    violation_type IN ('UNDERPAYMENT','OVERPAYMENT','MISSING','EXPIRED','TERRITORY','WRONG_TIER')
    OR violation_type IS NULL
  ),
  is_violation     boolean NOT NULL DEFAULT false,
  audited_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_results_contract_id ON audit_results(contract_id);
CREATE INDEX idx_audit_results_violation_type ON audit_results(violation_type);

-- 5. violations
CREATE TABLE violations (
  violation_id   text PRIMARY KEY,
  audit_id       text NOT NULL REFERENCES audit_results(audit_id),
  content_id     text NOT NULL,
  contract_id    text NOT NULL,
  violation_type text NOT NULL,
  description    text NOT NULL,
  severity       text NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  detected_at    timestamptz NOT NULL DEFAULT now(),
  reviewed_at    timestamptz
);

CREATE INDEX idx_violations_audit_id ON violations(audit_id);
CREATE INDEX idx_violations_severity ON violations(severity);

-- 6. agent_traces
CREATE TABLE agent_traces (
  trace_id       text PRIMARY KEY,
  run_id         text NOT NULL,
  agent_name     text NOT NULL,
  action         text NOT NULL,
  input_summary  text,
  output_summary text,
  duration_ms    int4,
  status         text NOT NULL CHECK (status IN ('running', 'completed', 'error')) DEFAULT 'running',
  timestamp      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_agent_traces_run_id ON agent_traces(run_id);
CREATE INDEX idx_agent_traces_agent_name ON agent_traces(agent_name);
