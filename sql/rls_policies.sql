-- =============================================
-- Row Level Security (RLS) Policies
-- Digital License Royalty Auditor
-- =============================================
--
-- All tables have RLS enabled. Policies:
--   - SELECT: open to all roles (anon + authenticated) for demo/dev
--   - INSERT: open on all tables (for seed and audit agent writes)
--   - UPDATE: open on audit_results, violations, agent_traces
--   - DELETE: open on all tables (for re-seeding)
--
-- In production, restrict to authenticated role only:
--   USING (auth.role() = 'authenticated')
--   WITH CHECK (auth.role() = 'authenticated')
-- =============================================

-- Enable RLS
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE streaming_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_traces ENABLE ROW LEVEL SECURITY;

-- ─── SELECT (all tables, all roles) ─────────
CREATE POLICY "read_contracts"      ON contracts      FOR SELECT USING (true);
CREATE POLICY "read_streaming_logs" ON streaming_logs  FOR SELECT USING (true);
CREATE POLICY "read_payment_ledger" ON payment_ledger  FOR SELECT USING (true);
CREATE POLICY "read_audit_results"  ON audit_results   FOR SELECT USING (true);
CREATE POLICY "read_violations"     ON violations      FOR SELECT USING (true);
CREATE POLICY "read_agent_traces"   ON agent_traces    FOR SELECT USING (true);

-- ─── INSERT (all tables) ────────────────────
CREATE POLICY "insert_contracts"      ON contracts      FOR INSERT WITH CHECK (true);
CREATE POLICY "insert_streaming_logs" ON streaming_logs  FOR INSERT WITH CHECK (true);
CREATE POLICY "insert_payment_ledger" ON payment_ledger  FOR INSERT WITH CHECK (true);
CREATE POLICY "insert_audit_results"  ON audit_results   FOR INSERT WITH CHECK (true);
CREATE POLICY "insert_violations"     ON violations      FOR INSERT WITH CHECK (true);
CREATE POLICY "insert_agent_traces"   ON agent_traces    FOR INSERT WITH CHECK (true);

-- ─── UPDATE (audit + agent tables) ──────────
CREATE POLICY "update_audit_results"  ON audit_results   FOR UPDATE USING (true);
CREATE POLICY "update_violations"     ON violations      FOR UPDATE USING (true);
CREATE POLICY "update_agent_traces"   ON agent_traces    FOR UPDATE USING (true);

-- ─── DELETE (all tables, for re-seeding) ────
CREATE POLICY "delete_contracts"      ON contracts      FOR DELETE USING (true);
CREATE POLICY "delete_streaming_logs" ON streaming_logs  FOR DELETE USING (true);
CREATE POLICY "delete_payment_ledger" ON payment_ledger  FOR DELETE USING (true);
CREATE POLICY "delete_audit_results"  ON audit_results   FOR DELETE USING (true);
CREATE POLICY "delete_violations"     ON violations      FOR DELETE USING (true);
CREATE POLICY "delete_agent_traces"   ON agent_traces    FOR DELETE USING (true);
