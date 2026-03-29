import { supabase } from '../supabase';

function uid() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'xxxx-xxxx-xxxx'.replace(/x/g, () => ((Math.random() * 16) | 0).toString(16));
}

/**
 * LedgerAgent
 *
 * Operates on the payment_ledger table. Provides retrieval, aggregation,
 * and gap-detection across the payment lifecycle.
 *
 * Every public method traces to agent_traces (agent_name: "LedgerAgent").
 */
export class LedgerAgent {
  constructor() {
    this.agentName = 'LedgerAgent';
    this.runId = uid().slice(0, 8);
  }

  // ── internal: trace logger ─────────────────────────────────────────
  async _trace(action, inputSummary, fn) {
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
          ? `Returned ${Array.isArray(result) ? result.length : 1} record(s) in ${duration}ms`
          : String(result).slice(0, 200),
        duration_ms: duration,
      }).eq('trace_id', traceId);

      return result;
    } catch (err) {
      const duration = Date.now() - start;
      await supabase.from('agent_traces').update({
        status: 'error',
        output_summary: err.message?.slice(0, 200),
        duration_ms: duration,
      }).eq('trace_id', traceId);
      throw err;
    }
  }

  // ── getPaymentsForContent ──────────────────────────────────────────
  async getPaymentsForContent(contentId) {
    return this._trace(
      'GET_PAYMENTS_FOR_CONTENT',
      `Fetch payment_ledger rows for ${contentId}`,
      async () => {
        const { data, error } = await supabase
          .from('payment_ledger')
          .select('*')
          .eq('content_id', contentId)
          .order('payment_date', { ascending: true });

        if (error) throw error;
        return data || [];
      }
    );
  }

  // ── getTotalPaid ───────────────────────────────────────────────────
  async getTotalPaid(contentId) {
    return this._trace(
      'GET_TOTAL_PAID',
      `Sum amount_paid for ${contentId}`,
      async () => {
        const { data, error } = await supabase
          .from('payment_ledger')
          .select('amount_paid')
          .eq('content_id', contentId);

        if (error) throw error;
        const total = (data || []).reduce((sum, row) => sum + (row.amount_paid || 0), 0);
        return parseFloat(total.toFixed(2));
      }
    );
  }

  // ── getPaymentTimeline ─────────────────────────────────────────────
  async getPaymentTimeline(contentId) {
    return this._trace(
      'GET_PAYMENT_TIMELINE',
      `Payment timeline for ${contentId}`,
      async () => {
        const { data, error } = await supabase
          .from('payment_ledger')
          .select('payment_id, amount_paid, payment_date')
          .eq('content_id', contentId)
          .order('payment_date', { ascending: true });

        if (error) throw error;

        // Build cumulative timeline
        let cumulative = 0;
        return (data || []).map((row) => {
          cumulative += row.amount_paid;
          return {
            payment_id: row.payment_id,
            payment_date: row.payment_date,
            amount_paid: row.amount_paid,
            cumulative_paid: parseFloat(cumulative.toFixed(2)),
          };
        });
      }
    );
  }

  // ── getMissingPayments ─────────────────────────────────────────────
  async getMissingPayments() {
    return this._trace(
      'GET_MISSING_PAYMENTS',
      'Find content_ids with active contracts but zero payments',
      async () => {
        // All content_ids with contracts
        const { data: contracts, error: cErr } = await supabase
          .from('contracts')
          .select('content_id, contract_id, studio, start_date, end_date');

        if (cErr) throw cErr;

        // All content_ids with at least one payment
        const { data: payments, error: pErr } = await supabase
          .from('payment_ledger')
          .select('content_id');

        if (pErr) throw pErr;

        const paidContentIds = new Set((payments || []).map((p) => p.content_id));

        // Filter to contracts that have NO payment entries
        const missing = (contracts || []).filter((c) => !paidContentIds.has(c.content_id));

        // Deduplicate by content_id
        const seen = new Set();
        const unique = [];
        for (const c of missing) {
          if (!seen.has(c.content_id)) {
            seen.add(c.content_id);
            unique.push({
              content_id: c.content_id,
              contract_id: c.contract_id,
              studio: c.studio,
              start_date: c.start_date,
              end_date: c.end_date,
            });
          }
        }

        return unique;
      }
    );
  }

  // ── getAllPayments (paginated) ──────────────────────────────────────
  async getAllPayments({ page = 1, perPage = 50 } = {}) {
    return this._trace(
      'GET_ALL_PAYMENTS',
      `Fetch all payments (page ${page})`,
      async () => {
        const from = (page - 1) * perPage;
        const to = from + perPage - 1;

        const { data, error, count } = await supabase
          .from('payment_ledger')
          .select('*, contracts!inner(studio, content_id)', { count: 'exact' })
          .order('payment_date', { ascending: false })
          .range(from, to);

        if (error) {
          // Fallback without join if the relationship fails
          const { data: fallback, error: fErr, count: fCount } = await supabase
            .from('payment_ledger')
            .select('*', { count: 'exact' })
            .order('payment_date', { ascending: false })
            .range(from, to);

          if (fErr) throw fErr;
          return { data: fallback || [], total: fCount || 0, page, perPage };
        }

        return { data: data || [], total: count || 0, page, perPage };
      }
    );
  }
}

// Singleton instance
export const ledgerAgent = new LedgerAgent();
