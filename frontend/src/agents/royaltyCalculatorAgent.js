import { supabase } from '../supabase';

function uid() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'xxxx-xxxx-xxxx'.replace(/x/g, () => ((Math.random() * 16) | 0).toString(16));
}

/**
 * RoyaltyCalculatorAgent
 *
 * Calculates expected royalties by cross-referencing streaming_logs with
 * contracts.  Applies tier-based pricing rules and produces a step-by-step
 * audit trail for every calculation.
 *
 * Every public method traces to agent_traces (agent_name: "RoyaltyCalculatorAgent").
 */
export class RoyaltyCalculatorAgent {
  constructor() {
    this.agentName = 'RoyaltyCalculatorAgent';
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

  // ── calculateExpected ──────────────────────────────────────────────
  async calculateExpected(contentId) {
    return this._trace(
      'CALCULATE_EXPECTED',
      `Calculate expected royalty for ${contentId}`,
      async () => {
        const steps = [];

        // 1. Fetch contract for content_id
        const { data: contracts, error: cErr } = await supabase
          .from('contracts')
          .select('*')
          .eq('content_id', contentId);

        if (cErr) throw cErr;
        if (!contracts || contracts.length === 0) {
          steps.push(`No contract found for ${contentId}`);
          return {
            content_id: contentId,
            contract_id: null,
            total_plays: 0,
            rate_applied: 0,
            tier_applied: false,
            expected_royalty: 0,
            calculation_steps: steps,
          };
        }

        const contract = contracts[0];
        steps.push(`Fetched contract ${contract.contract_id} for ${contentId}`);

        // 2. Fetch total plays within contract territory and date range
        const { data: logs, error: lErr } = await supabase
          .from('streaming_logs')
          .select('plays, country, timestamp')
          .eq('content_id', contentId);

        if (lErr) throw lErr;

        const territories = new Set(contract.territory || []);
        const startDate = new Date(contract.start_date);
        const endDate = new Date(contract.end_date);

        let totalPlays = 0;
        let filteredCount = 0;
        for (const log of (logs || [])) {
          const logDate = new Date(log.timestamp);
          if (territories.has(log.country) && logDate >= startDate && logDate <= endDate) {
            totalPlays += log.plays;
            filteredCount++;
          }
        }

        steps.push(
          `Total plays in territory [${[...territories].join(', ')}]: ${totalPlays.toLocaleString()} (from ${filteredCount.toLocaleString()} qualifying log entries)`
        );
        steps.push(
          `Contract period: ${contract.start_date} to ${contract.end_date}`
        );

        // 3. Apply tier logic
        const threshold = contract.tier_threshold || 100000;
        let rate;
        let tierApplied;

        if (totalPlays < threshold) {
          rate = contract.rate_per_play;
          tierApplied = false;
          steps.push(
            `Plays (${totalPlays.toLocaleString()}) below tier_threshold (${threshold.toLocaleString()}) -- applying standard rate $${rate.toFixed(4)}`
          );
        } else {
          rate = contract.tier_rate;
          tierApplied = true;
          steps.push(
            `Plays (${totalPlays.toLocaleString()}) exceed tier_threshold (${threshold.toLocaleString()}) -- applying tier rate $${rate.toFixed(4)}`
          );
        }

        // 4. Calculate expected royalty
        const expectedRoyalty = parseFloat((totalPlays * rate).toFixed(2));
        steps.push(
          `Expected royalty: ${totalPlays.toLocaleString()} x $${rate.toFixed(4)} = $${expectedRoyalty.toLocaleString()}`
        );

        return {
          content_id: contentId,
          contract_id: contract.contract_id,
          total_plays: totalPlays,
          rate_applied: rate,
          tier_applied: tierApplied,
          expected_royalty: expectedRoyalty,
          calculation_steps: steps,
        };
      }
    );
  }

  // ── calculateAll ───────────────────────────────────────────────────
  async calculateAll() {
    return this._trace(
      'CALCULATE_ALL',
      'Calculate expected royalties for all content_ids',
      async () => {
        // Get all distinct content_ids from contracts
        const { data: contracts, error } = await supabase
          .from('contracts')
          .select('content_id');

        if (error) throw error;

        const contentIds = [...new Set((contracts || []).map((c) => c.content_id))];

        // Run calculations in parallel batches of 10
        const results = [];
        const batchSize = 10;
        for (let i = 0; i < contentIds.length; i += batchSize) {
          const batch = contentIds.slice(i, i + batchSize);
          const batchResults = await Promise.all(
            batch.map((cid) => this.calculateExpected(cid))
          );
          results.push(...batchResults);
        }

        return results.sort((a, b) => b.expected_royalty - a.expected_royalty);
      }
    );
  }
}

// Singleton instance
export const royaltyCalculatorAgent = new RoyaltyCalculatorAgent();
