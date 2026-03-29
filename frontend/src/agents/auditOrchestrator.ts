import { supabase } from '../lib/supabase';
import { auditAgent } from './auditAgent';
import { violationAgent } from './violationAgent';
import { auditLogGenerator } from './auditLogGenerator';
// Native JS agent imports
import { streamingLogAgent } from './streamingLogAgent';
import { royaltyCalculatorAgent } from './royaltyCalculatorAgent';
import { ledgerAgent } from './ledgerAgent';

function generateRunId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID().slice(0, 8).toUpperCase();
  return 'xxxx-xxxx'.replace(/x/g, () => ((Math.random() * 16) | 0).toString(16)).toUpperCase();
}

export type OrchestratorSummary = {
  run_id: string;
  contracts_loaded: number;
  plays_aggregated: number;
  payments_expected: number;
  payments_ledgered: number;
  discrepancies_found: number;
  violations_detected: number;
  duration_ms: number;
  status: string;
}

export class AuditOrchestrator {
  private _cancelFlag = false;
  private _runId = '';

  cancelAudit() {
    this._cancelFlag = true;
  }

  // Emitter function bound to DOM for React visualization
  private async _emitStep(agentName: string, actionDesc: string, inputMsg: string, callback: () => Promise<any>): Promise<any> {
    if (this._cancelFlag) throw new Error("GRACEFUL_TERMINATION");
    
    const start = Date.now();
    const traceId = `tr_${generateRunId()}`;

    // Emit 'running' state immediately to UI
    window.dispatchEvent(new CustomEvent('agent:step', { 
      detail: { agent: agentName, status: 'running', message: inputMsg, traceId }
    }));

    // Record to DB traces natively like other agents
    await supabase.from('agent_traces').insert({
      trace_id: traceId,
      run_id: this._runId,
      agent_name: agentName,
      action: actionDesc,
      input_summary: inputMsg,
      status: 'running',
      timestamp: new Date().toISOString()
    });

    try {
      const result = await callback();
      if (this._cancelFlag) throw new Error("GRACEFUL_TERMINATION");
      
      const duration = Date.now() - start;

      let resultPhrase = '';
      if (result !== undefined && result !== null) {
        if (typeof result === 'string') resultPhrase = result;
        else if (result.message) resultPhrase = result.message;
        else if (result.count !== undefined) resultPhrase = `processed ${result.count} records`;
      }

      // Output update to DB
      await supabase.from('agent_traces').update({
        status: 'completed',
        duration_ms: duration,
        output_summary: resultPhrase || `Completed successfully`
      }).eq('trace_id', traceId);

      // Fire completion to DOM
      window.dispatchEvent(new CustomEvent('agent:step', { 
        detail: { agent: agentName, status: 'completed', message: resultPhrase, duration, traceId }
      }));

      return result;
    } catch (err: any) {
      if (err.message === 'GRACEFUL_TERMINATION') {
         window.dispatchEvent(new CustomEvent('agent:step', { detail: { agent: agentName, status: 'error', message: 'Audit Canceled by Operator' } }));
         throw err;
      }
      const duration = Date.now() - start;
      await supabase.from('agent_traces').update({
        status: 'error',
        duration_ms: duration,
        output_summary: err.message
      }).eq('trace_id', traceId);

      window.dispatchEvent(new CustomEvent('agent:step', { 
        detail: { agent: agentName, status: 'error', message: `FAILED: ${err.message}`, duration, traceId }
      }));
      throw err;
    }
  }

  async runCompleteAudit(): Promise<OrchestratorSummary> {
    const totalStart = Date.now();
    this._cancelFlag = false;
    this._runId = generateRunId();

    const summary: OrchestratorSummary = {
      run_id: this._runId,
      contracts_loaded: 0,
      plays_aggregated: 0,
      payments_expected: 0,
      payments_ledgered: 0,
      discrepancies_found: 0,
      violations_detected: 0,
      duration_ms: 0,
      status: 'success'
    };

    try {
      // 1. ContractReaderAgent
      summary.contracts_loaded = await this._emitStep('ContractReaderAgent', 'FETCH_CONTRACTS', 'loading active contracts...', async () => {
        const { count, error } = await supabase.from('contracts').select('*', { count: 'exact', head: true });
        if (error) throw error;
        // Mock a 400ms delay to make trace readable in terminal visualizer
        await new Promise(r => setTimeout(r, 400));
        return { count, message: `loaded ${count || 0} contracts` };
      }).then(r => r.count || 0);

      // 2. StreamingLogAgent
      summary.plays_aggregated = await this._emitStep('StreamingLogAgent', 'AGGREGATE_PLAYS', 'aggregating play records...', async () => {
        const { count, error } = await supabase.from('streaming_logs').select('*', { count: 'exact', head: true });
        if (error) throw error;
        await new Promise(r => setTimeout(r, 600));
        return { count, message: `aggregated ${count || 0} play records` };
      }).then(r => r.count || 0);

      // 3. RoyaltyCalculatorAgent
      summary.payments_expected = await this._emitStep('RoyaltyCalculatorAgent', 'CALCULATE_ROYALTIES', 'calculating expected royalties...', async () => {
        const data = await royaltyCalculatorAgent.calculateAll();
        return { count: data?.length || 0, message: `calculated ${data?.length || 0} expected payments` };
      }).then(r => r.count || 0);

      // 4. LedgerAgent
      summary.payments_ledgered = await this._emitStep('LedgerAgent', 'FETCH_LEDGER', 'fetching payment records...', async () => {
        const { count, error } = await supabase.from('payment_ledger').select('*', { count: 'exact', head: true });
        if (error) throw error;
        await new Promise(r => setTimeout(r, 350));
        return { count, message: `fetched ${count || 0} payment records` };
      }).then(r => r.count || 0);

      // 5. AuditAgent
      summary.discrepancies_found = await this._emitStep('AuditAgent', 'RUN_AUDIT', 'comparing ledgers for discrepancies...', async () => {
        // We override AuditAgent's native internal run ID to keep trace bounds locked.
        auditAgent.runId = this._runId;
        const res = await auditAgent.runFullAudit();
        return { count: res.violations, message: `found ${res.violations} discrepancies` };
      }).then(r => r.count || 0);

      // 6. ViolationAgent
      summary.violations_detected = await this._emitStep('ViolationAgent', 'CHECK_VIOLATIONS', 'detecting forensics and territory breaches...', async () => {
        const res = await violationAgent.checkAllViolations(this._runId);
        return { count: res.length, message: `detected ${res.length} violations` };
      }).then(r => r.count || 0);

      // 7. AuditLogGenerator (Reporter Agent)
      await this._emitStep('ReporterAgent', 'GENERATE_REPORT', 'generating audit logs...', async () => {
        await auditLogGenerator.generateAuditRecord(this._runId, summary.discrepancies_found || 0);
        return { message: 'audit log saved' };
      });

    } catch (err: any) {
      if (err.message === 'GRACEFUL_TERMINATION') {
        summary.status = 'cancelled';
      } else {
        summary.status = 'error';
      }
    }

    summary.duration_ms = Date.now() - totalStart;
    return summary;
  }

  async getRunHistory() {
    const { data: traces, error } = await supabase
      .from('agent_traces')
      .select('run_id, timestamp, duration_ms, status')
      .eq('agent_name', 'AuditAgent') // AuditAgent represents a completed master cycle bounds typically
      .order('timestamp', { ascending: false })
      .limit(10);
      
    if (error) throw error;

    // Deduplicate runs gracefully based on run_id
    const runsMap = new Map();
    for (const t of traces || []) {
       if (!runsMap.has(t.run_id)) runsMap.set(t.run_id, t);
    }
    
    return Array.from(runsMap.values());
  }
}

export const auditOrchestrator = new AuditOrchestrator();
