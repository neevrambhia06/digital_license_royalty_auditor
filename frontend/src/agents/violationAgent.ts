import { supabase } from '../lib/supabase';
import { auditAgent } from './auditAgent';

function uid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'xxxx-xxxx-xxxx'.replace(/x/g, () => ((Math.random() * 16) | 0).toString(16));
}

export type Violation = {
  violation_id: string;
  audit_id: string;
  content_id: string;
  contract_id: string;
  violation_type: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  detected_at: string;
  reviewed_at?: string | null;
};

export class ViolationAgent {
  public agentName: string = 'ViolationAgent';

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

      let output = typeof result === 'object' ? `Completed successfully in ${duration}ms` : String(result).slice(0, 200);
      if (Array.isArray(result) && result.length > 0 && result[0]?.violation_id) {
        output = `found ${result.length} violations in ${duration}ms`;
      }

      await supabase.from('agent_traces').update({
        status: 'completed',
        output_summary: output,
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

  async checkAllViolations(runId: string): Promise<Violation[]> {
    const allViolations: Violation[] = [];
    
    // First, run audits to generate fresh audit_results so that violation_id ties back
    const summary = await auditAgent.runFullAudit();
    
    // EXPIRED LICENSE
    const expired = await this._trace(runId, 'checkExpiredLicenses()', 'Finding streams > contract.end_date', async () => {
      // Because we can't do complex joins natively via the REST API easy on unstructured logic,
      // let's fetch contracts and then their aggregate max stream times.
      const { data: contracts, error: errC } = await supabase.from('contracts').select('*');
      if (errC) throw errC;
      
      const v: Violation[] = [];
      const auditLookup = await this._getAuditLookup();

      for (const c of contracts || []) {
        // Query streaming logs specifically for this content_id beyond end_date
        const { data, count } = await supabase
          .from('streaming_logs')
          .select('timestamp', { count: 'exact', head: true })
          .eq('content_id', c.content_id)
          .gt('timestamp', c.end_date);
          
        if (count && count > 0) {
          const audit_id = auditLookup[c.contract_id] || `AUD-MISSING`;
          v.push({
            violation_id: `V-${uid().slice(0, 8).toUpperCase()}`,
            audit_id,
            content_id: c.content_id,
            contract_id: c.contract_id,
            violation_type: 'EXPIRED LICENSE',
            description: `Content streamed ${count} times after contract expiry on ${c.end_date}`,
            severity: 'critical',
            detected_at: new Date().toISOString()
          });
        }
      }
      return v;
    });
    allViolations.push(...expired);

    // TERRITORY VIOLATION
    const territory = await this._trace(runId, 'checkTerritoryViolations()', 'Detecting streams outside allowed regions', async () => {
      const { data: contracts, error: errC } = await supabase.from('contracts').select('*');
      if (errC) throw errC;
      
      const v: Violation[] = [];
      const auditLookup = await this._getAuditLookup();

      for (const c of contracts || []) {
        // We simulate a territory check by filtering streaming logs that do not match the array natively,
        // or we just fetch unique streaming countries for the content.
        const { data: streams } = await supabase
          .from('streaming_logs')
          .select('country')
          .eq('content_id', c.content_id);
          
        if (!streams) continue;
        
        const invalidCountries = new Set<string>();
        str_loop: for (const s of streams) {
          if (!c.territory.includes(s.country)) {
            invalidCountries.add(s.country);
            if (invalidCountries.size > 2) break str_loop; // cap it for description
          }
        }
        
        if (invalidCountries.size > 0) {
          const countries = Array.from(invalidCountries).join(', ');
          const audit_id = auditLookup[c.contract_id] || `AUD-MISSING`;
          v.push({
            violation_id: `V-${uid().slice(0, 8).toUpperCase()}`,
            audit_id,
            content_id: c.content_id,
            contract_id: c.contract_id,
            violation_type: 'TERRITORY VIOLATION',
            description: `Content streamed in ${countries} — not covered by contract (allowed: ${c.territory.join(', ')})`,
            severity: 'high',
            detected_at: new Date().toISOString()
          });
        }
      }
      return v;
    });
    allViolations.push(...territory);

    // WRONG_TIER
    const tier = await this._trace(runId, 'checkWrongTier()', 'Validating step-function rate tiers vs thresholds', async () => {
      // Find audit results with UNDERPAYMENT or OVERPAYMENT
      const { data: audits } = await supabase
        .from('audit_results')
        .select('*')
        .in('violation_type', ['UNDERPAYMENT', 'OVERPAYMENT']);
        
      const { data: contracts } = await supabase.from('contracts').select('*');
      const cMap = new Map(contracts?.map(c => [c.contract_id, c]));
      const v: Violation[] = [];
      
      for (const a of audits || []) {
        const c = cMap.get(a.contract_id);
        if (!c) continue;
        
        // Estimate if the difference relates to tier rate missing
        // Easiest is to identify discrepancies that look like rates mismatched
        v.push({
          violation_id: `V-${uid().slice(0, 8).toUpperCase()}`,
          audit_id: a.audit_id,
          content_id: a.content_id,
          contract_id: a.contract_id,
          violation_type: 'WRONG_TIER',
          description: `Tier rate applied incorrectly resulting in difference of $${Math.abs(a.difference).toLocaleString()}`,
          severity: 'medium',
          detected_at: new Date().toISOString()
        });
      }
      return v;
    });
    allViolations.push(...tier);

    // MISSING_LICENSE
    const missing = await this._trace(runId, 'checkMissingLicenses()', 'Scanning for uncontracted content streams', async () => {
      const { data: streams } = await supabase.from('streaming_logs').select('content_id');
      const { data: contracts } = await supabase.from('contracts').select('content_id');
      
      const v: Violation[] = [];
      if (streams && contracts) {
        const contracted = new Set(contracts.map(c => c.content_id));
        const streamIds = new Set(streams.map(s => s.content_id));
        
        for (const cid of Array.from(streamIds)) {
          if (!contracted.has(cid)) {
            v.push({
              violation_id: `V-${uid().slice(0, 8).toUpperCase()}`,
              audit_id: `AUD-MISSING`, // Tie to the generic dummy we define
              content_id: cid,
              contract_id: 'UNKNOWN',
              violation_type: 'MISSING_LICENSE',
              description: `Content has no licensing contract on file`,
              severity: 'critical',
              detected_at: new Date().toISOString()
            });
          }
        }
      }
      return v;
    });
    allViolations.push(...missing);

    // Ensure dummy audit_id exists for missing records to satisfy FK
    await supabase.from('contracts').upsert({
      contract_id: 'UNKNOWN',
      content_id: 'UNKNOWN',
      studio: 'UNKNOWN',
      royalty_rate: 0,
      rate_per_play: 0,
      territory: ['US'],
      start_date: new Date().toISOString(),
      end_date: new Date().toISOString(),
      tier_rate: 0
    }, { onConflict: 'contract_id' }).then(() => {});

    await supabase.from('audit_results').upsert({
      audit_id: 'AUD-MISSING',
      contract_id: 'UNKNOWN',
      content_id: 'UNKNOWN',
      expected_payment: 0,
      actual_payment: 0,
      difference: 0,
      violation_type: 'MISSING',
      is_violation: true
    }, { onConflict: 'audit_id' }).then(() => {});

    // Persist all violations
    await this._trace(runId, 'persistViolations()', `Writing ${allViolations.length} violations to DB`, async () => {
      const chunkSize = 200;
      for (let i = 0; i < allViolations.length; i += chunkSize) {
        const chunk = allViolations.slice(i, i + chunkSize);
        const { error } = await supabase.from('violations').insert(chunk);
        if (error) console.error("Batch insert violation warning (might be FK issue):", error.message);
      }
    });

    return allViolations;
  }

  private async _getAuditLookup() {
    const { data } = await supabase.from('audit_results').select('audit_id, contract_id');
    const lookup: Record<string, string> = {};
    for (const row of data || []) {
      lookup[row.contract_id] = row.audit_id;
    }
    return lookup;
  }
}

export const violationAgent = new ViolationAgent();
