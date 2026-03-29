import { supabase } from '../supabase';
import { royaltyCalculatorAgent } from './royaltyCalculatorAgent';
import { ledgerAgent } from './ledgerAgent';

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

export class AuditAgent {
  public agentName: string = 'AuditAgent';
  public runId: string;

  constructor() {
    this.runId = uid().slice(0, 8);
  }

  // ── internal: trace logger ─────────────────────────────────────────
  async _trace<T>(action: string, inputSummary: string, fn: () => Promise<T>): Promise<T> {
    const traceId = `tr_${uid().slice(0, 12)}`;
    const start = Date.now();

    await supabase.from('agent_traces').insert({
      trace_id: traceId,
      run_id: this.runId,
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
        output_summary: typeof result === 'object'
          ? `Completed successfully in ${duration}ms`
          : String(result).slice(0, 200),
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

  // ── runFullAudit ───────────────────────────────────────────────────
  async runFullAudit(): Promise<AuditSummary> {
    const auditStart = Date.now();
    this.runId = uid().slice(0, 8); // Generate new run ID per full audit

    // 1. Fetch all contracts via ContractReaderAgent equivalent
    const contracts = await this._trace(
      'FETCH_CONTRACTS',
      'Loaded active contracts',
      async () => {
        const { data, error } = await supabase.from('contracts').select('*');
        if (error) throw error;
        return data || [];
      }
    );

    // 2. Fetch expected royalties for all content (calculates per contract actually via RoyaltyAgent's batch processing)
    const expectedBatch = await royaltyCalculatorAgent.calculateAll();
    const expectedMap = new Map(expectedBatch.map((e: any) => [e.content_id, e.expected_royalty]));

    // 3. Fetch total paid per content directly to save queries
    const allPayments = await this._trace(
      'FETCH_ALL_PAYMENTS',
      'Loaded all ledger entries',
      async () => {
        // We bypass ledgerAgent's getTotalPaid individual calls to fetch all at once for the massive scale
        const { data, error } = await supabase.from('payment_ledger').select('content_id, amount_paid');
        if (error) throw error;
        return data || [];
      }
    );

    const paidMap = new Map<string, number>();
    for (const p of allPayments) {
      paidMap.set(p.content_id, (paidMap.get(p.content_id) || 0) + p.amount_paid);
    }

    // 4. Compare expected vs paid to find violations
    const results: any[] = [];
    let total_expected = 0;
    let total_paid = 0;
    let total_leakage = 0;
    let underpayments = 0;
    let overpayments = 0;
    let missing_payments = 0;
    let violations = 0;

    await this._trace('DETECT_LEAKAGES', 'Compare expected and paid amounts', async () => {
      for (const contract of contracts) {
        const expected = Number(expectedMap.get(contract.content_id)) || 0;
        const paid = Number(paidMap.get(contract.content_id)) || 0;
        total_expected += expected;
        total_paid += paid;

        const difference = expected - paid;
        let violation_type = null;
        let is_violation = false;

        // Tolerance for floating point precision: 0.01
        if (paid === 0 && expected > 0) {
          violation_type = 'MISSING';
          missing_payments++;
          is_violation = true;
          total_leakage += expected;
        } else if (difference > 0.01) {
          violation_type = 'UNDERPAYMENT';
          underpayments++;
          is_violation = true;
          total_leakage += difference;
        } else if (difference < -0.01) {
          violation_type = 'OVERPAYMENT';
          overpayments++;
          is_violation = true;
        }

        if (is_violation) violations++;

        results.push({
          audit_id: `AUD-${uid().slice(0, 8).toUpperCase()}`,
          contract_id: contract.contract_id,
          content_id: contract.content_id,
          expected_payment: Number(expected.toFixed(2)),
          actual_payment: Number(paid.toFixed(2)),
          difference: Number(difference.toFixed(2)),
          violation_type: violation_type,
          is_violation: is_violation,
          audited_at: new Date().toISOString()
        });
      }
    });

    // 5. Write results to audit_results table
    await this._trace('PERSIST_RESULTS', `Writing ${results.length} audit results`, async () => {
      // Clear previous results optionally, or just append since we use UUIDs?
      // Usually audits are point-in-time. We will let them append.
      // Batch insert in chunks of 500
      const chunkSize = 500;
      for (let i = 0; i < results.length; i += chunkSize) {
        const chunk = results.slice(i, i + chunkSize);
        const { error } = await supabase.from('audit_results').insert(chunk);
        if (error) console.error("Error inserting audit results chunk", error);
      }
    });

    const audit_duration_ms = Date.now() - auditStart;

    const summary: AuditSummary = {
      total_contracts_audited: contracts.length,
      total_expected: Number(total_expected.toFixed(2)),
      total_paid: Number(total_paid.toFixed(2)),
      total_leakage: Number(total_leakage.toFixed(2)),
      underpayments,
      overpayments,
      missing_payments,
      violations,
      audit_duration_ms,
      run_id: this.runId
    };

    return summary;
  }

  // ── getAuditResults ────────────────────────────────────────────────
  async getAuditResults(filters?: { violation_type?: string, min_difference?: number }) {
    return this._trace('GET_RESULTS', 'Fetch audit results', async () => {
      let query = supabase.from('audit_results').select('*, contracts(studio)');
      if (filters?.violation_type) query = query.eq('violation_type', filters.violation_type);
      if (filters?.min_difference) query = query.gte('difference', filters.min_difference);

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    });
  }

  // ── getLeakageSummary ──────────────────────────────────────────────
  async getLeakageSummary() {
    return this._trace('GET_LEAKAGE_SUMMARY', 'Aggregate leakage info', async () => {
      const { data, error } = await supabase
        .from('audit_results')
        .select('content_id, difference, violation_type, contracts(studio)')
        .eq('is_violation', true);

      if (error) throw error;

      const summary = {
        by_studio: new Map<string, number>(),
        by_content: new Map<string, number>(),
        by_violation_type: new Map<string, { count: number, total: number }>(),
      };

      for (const r of data || []) {
        const row: any = r; // bypass loose typing
        const diff = row.difference > 0 ? row.difference : 0; // Focus on leakage (underpayments & missing)
        const studio = Array.isArray(row.contracts) ? row.contracts[0]?.studio : row.contracts?.studio || 'Unknown';
        
        // aggregate studio
        summary.by_studio.set(studio, (summary.by_studio.get(studio) || 0) + diff);
        // aggregate content
        summary.by_content.set(row.content_id, (summary.by_content.get(row.content_id) || 0) + diff);
        
        // aggregate violation type
        if (row.violation_type) {
          const vType = summary.by_violation_type.get(row.violation_type) || { count: 0, total: 0 };
          vType.count += 1;
          vType.total += Math.abs(row.difference); 
          summary.by_violation_type.set(row.violation_type, vType);
        }
      }

      return {
        by_studio: Array.from(summary.by_studio.entries()).map(([studio, leakage]) => ({ studio, leakage: Number(leakage.toFixed(2)) })).sort((a,b) => b.leakage - a.leakage),
        by_content: Array.from(summary.by_content.entries()).map(([content_id, leakage]) => ({ content_id, leakage: Number(leakage.toFixed(2)) })).sort((a,b) => b.leakage - a.leakage),
        by_violation_type: Array.from(summary.by_violation_type.entries()).map(([type, stats]) => ({ type, count: stats.count, total: Number(stats.total.toFixed(2)) }))
      };
    });
  }
}

export const auditAgent = new AuditAgent();
