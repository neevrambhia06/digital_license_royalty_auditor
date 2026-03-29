import { supabase } from '../lib/supabase';

// Helper for generating UUID-like strings if needed
function uid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'xxxx-xxxx-xxxx'.replace(/x/g, () => ((Math.random() * 16) | 0).toString(16));
}

export type AuditSummary = {
  total_contracts_audited: number;
  total_expected: number;
  total_paid: number;
  total_leakage: number;
  underpayments: number;
  overpayments: number;
  missing_payments: number;
  violations: number;
  audit_duration_ms: number;
  run_id: string;
};

export class AuditLogGenerator {
  public agentName: string = 'AuditLogGenerator';

  // Helper trace
  async _trace<T>(runId: string, action: string, inputSummary: string, fn: () => Promise<T>): Promise<T> {
    const traceId = `tr_${uid().slice(0, 12)}`;
    const start = Date.now();

    await supabase.from('agent_traces').insert({
      trace_id: traceId,
      run_id: runId,
      agent_name: this.agentName,
      action,
      input_summary: inputSummary,
      status: 'running',
      timestamp: new Date().toISOString(),
    });

    try {
      const result = await fn();
      const duration = Date.now() - start;

      await supabase.from('agent_traces').update({
        status: 'completed',
        output_summary: typeof result === 'object' ? `Completed successfully in ${duration}ms` : String(result).slice(0, 200),
        duration_ms: duration,
      }).eq('trace_id', traceId);

      return result;
    } catch (err: any) {
      const duration = Date.now() - start;
      await supabase.from('agent_traces').update({
        status: 'error',
        output_summary: err.message?.slice(0, 200),
        duration_ms: duration,
      }).eq('trace_id', traceId);
      throw err;
    }
  }

  async generateAuditRecord(runId: string, auditResult: any): Promise<string> {
    return this._trace(runId, 'generateAuditRecord', `Writing audit_results for contract ${auditResult.contract_id}`, async () => {
      const audit_id = auditResult.audit_id || `AUD-${uid().slice(0, 8).toUpperCase()}`;
      
      const { error } = await supabase.from('audit_results').insert({
        ...auditResult,
        audit_id
      });
      
      if (error) throw error;
      return audit_id;
    });
  }

  async getFullLog(runId: string): Promise<any[]> {
    return this._trace(runId, 'getFullLog', `Fetching log for ${runId}`, async () => {
      const { data, error } = await supabase
        .from('agent_traces')
        .select('*')
        .eq('run_id', runId)
        .order('timestamp', { ascending: true });
        
      if (error) throw error;
      return data || [];
    });
  }

  async exportLog(runId: string): Promise<string> {
    return this._trace(runId, 'exportLog', `Generating CSV for ${runId}`, async () => {
      const logs = await this.getFullLog(runId);
      if (!logs.length) return "Timestamp,Agent,Action,Status,Input,Output,Duration(ms)\n";
      
      const header = ["Timestamp", "Agent", "Action", "Status", "Input", "Output", "Duration(ms)"].join(",") + "\n";
      const rows = logs.map(l => {
        return [
          l.timestamp,
          l.agent_name,
          l.action,
          l.status,
          `"${(l.input_summary || '').replace(/"/g, '""')}"`,
          `"${(l.output_summary || '').replace(/"/g, '""')}"`,
          l.duration_ms
        ].join(",");
      }).join("\n");
      
      return header + rows;
    });
  }

  async getRegulatorReport(runId: string, summary: AuditSummary, violations: any[]): Promise<any> {
    return this._trace(runId, 'getRegulatorReport', `Structuring JSON payload`, async () => {
      return {
        report_id: `REP-${uid().slice(0, 8).toUpperCase()}`,
        generated_at: new Date().toISOString(),
        auditor: "Digital License Royalty Auditor v1.0",
        summary: summary,
        violations: violations,
        methodology: "Reconciliation engine parsed active contract terms against aggregated stream chunks applying geometric tiering rules.",
        certification: "Automated audit — for human review"
      };
    });
  }
}

export const auditLogGenerator = new AuditLogGenerator();
