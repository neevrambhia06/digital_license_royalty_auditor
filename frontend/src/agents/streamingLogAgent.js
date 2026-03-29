import { supabase } from '../supabase';

function uid() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'xxxx-xxxx-xxxx'.replace(/x/g, () => ((Math.random() * 16) | 0).toString(16));
}

/**
 * StreamingLogAgent
 *
 * Operates on streaming_logs, cross-references contracts for territory/date
 * validation, and detects statistical anomalies.  Every public method logs
 * its execution to agent_traces (agent_name: "StreamingLogAgent").
 */
export class StreamingLogAgent {
  constructor() {
    this.agentName = 'StreamingLogAgent';
    this.runId = uid().slice(0, 8);
  }

  // ── internal: trace logger ─────────────────────────────────────────
  async _trace(action, inputSummary, fn) {
    const traceId = `tr_${uid().slice(0, 12)}`;
    const start = Date.now();

    // insert "running" trace
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

  // ── aggregateByContent ─────────────────────────────────────────────
  async aggregateByContent() {
    return this._trace('AGGREGATE_BY_CONTENT', 'Group streaming_logs by content_id', async () => {
      const { data, error } = await supabase
        .from('streaming_logs')
        .select('content_id, plays, country, timestamp');

      if (error) throw error;

      const map = {};
      for (const row of data || []) {
        if (!map[row.content_id]) {
          map[row.content_id] = {
            content_id: row.content_id,
            total_plays: 0,
            countries: new Set(),
            min_date: row.timestamp,
            max_date: row.timestamp,
          };
        }
        const agg = map[row.content_id];
        agg.total_plays += row.plays;
        agg.countries.add(row.country);
        if (row.timestamp < agg.min_date) agg.min_date = row.timestamp;
        if (row.timestamp > agg.max_date) agg.max_date = row.timestamp;
      }

      return Object.values(map).map((a) => ({
        content_id: a.content_id,
        total_plays: a.total_plays,
        countries: [...a.countries],
        date_range: { min: a.min_date, max: a.max_date },
      }));
    });
  }

  // ── getLogsByContent ───────────────────────────────────────────────
  async getLogsByContent(contentId, { page = 1, perPage = 50 } = {}) {
    return this._trace(
      'GET_LOGS_BY_CONTENT',
      `Fetch logs for ${contentId} (page ${page})`,
      async () => {
        const from = (page - 1) * perPage;
        const to = from + perPage - 1;

        const { data, error, count } = await supabase
          .from('streaming_logs')
          .select('*', { count: 'exact' })
          .eq('content_id', contentId)
          .order('timestamp', { ascending: false })
          .range(from, to);

        if (error) throw error;
        return { data: data || [], total: count || 0, page, perPage };
      },
    );
  }

  // ── detectAnomalies ────────────────────────────────────────────────
  async detectAnomalies() {
    return this._trace('DETECT_ANOMALIES', 'Cross-reference logs against contracts for violations', async () => {
      // Fetch all logs and all contracts
      const [logsRes, contractsRes] = await Promise.all([
        supabase.from('streaming_logs').select('*'),
        supabase.from('contracts').select('content_id, territory, end_date'),
      ]);

      if (logsRes.error) throw logsRes.error;
      if (contractsRes.error) throw contractsRes.error;

      const logs = logsRes.data || [];
      const contracts = contractsRes.data || [];

      // Build contract lookup: content_id -> { territories, end_date }
      const contractMap = {};
      for (const c of contracts) {
        if (!contractMap[c.content_id]) {
          contractMap[c.content_id] = {
            territories: new Set(),
            end_dates: [],
          };
        }
        const cm = contractMap[c.content_id];
        (c.territory || []).forEach((t) => cm.territories.add(t));
        cm.end_dates.push(new Date(c.end_date));
      }

      // Compute per-content play stats for outlier detection
      const statsMap = {};
      for (const log of logs) {
        if (!statsMap[log.content_id]) statsMap[log.content_id] = [];
        statsMap[log.content_id].push(log.plays);
      }

      const contentStats = {};
      for (const [cid, plays] of Object.entries(statsMap)) {
        const n = plays.length;
        const mean = plays.reduce((s, v) => s + v, 0) / n;
        const variance = plays.reduce((s, v) => s + (v - mean) ** 2, 0) / n;
        const stdDev = Math.sqrt(variance);
        contentStats[cid] = { mean, stdDev };
      }

      // Detect anomalies
      const anomalies = [];
      for (const log of logs) {
        const contract = contractMap[log.content_id];
        const stats = contentStats[log.content_id];
        const reasons = [];

        if (contract) {
          // Territory violation
          if (!contract.territories.has(log.country)) {
            reasons.push('TERRITORY_VIOLATION');
          }
          // Expired license
          const logDate = new Date(log.timestamp);
          const latestEnd = contract.end_dates.reduce((a, b) => (a > b ? a : b));
          if (logDate > latestEnd) {
            reasons.push('EXPIRED_LICENSE');
          }
        }

        // Statistical outlier
        if (stats && stats.stdDev > 0 && log.plays > stats.mean + 3 * stats.stdDev) {
          reasons.push('STATISTICAL_OUTLIER');
        }

        if (reasons.length > 0) {
          anomalies.push({
            play_id: log.play_id,
            content_id: log.content_id,
            country: log.country,
            plays: log.plays,
            timestamp: log.timestamp,
            user_type: log.user_type,
            device: log.device,
            violation_types: reasons,
          });
        }
      }

      return anomalies;
    });
  }

  // ── getCountryBreakdown ────────────────────────────────────────────
  async getCountryBreakdown(contentId) {
    return this._trace(
      'COUNTRY_BREAKDOWN',
      `Plays per country for ${contentId}`,
      async () => {
        const { data, error } = await supabase
          .from('streaming_logs')
          .select('country, plays')
          .eq('content_id', contentId);

        if (error) throw error;

        const map = {};
        for (const row of data || []) {
          map[row.country] = (map[row.country] || 0) + row.plays;
        }

        return Object.entries(map)
          .map(([country, plays]) => ({ country, plays }))
          .sort((a, b) => b.plays - a.plays);
      },
    );
  }

  // ── getPeakPeriods ─────────────────────────────────────────────────
  async getPeakPeriods() {
    return this._trace('PEAK_PERIODS', 'Top 10 content_ids by play volume (last 30 days)', async () => {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();

      const { data, error } = await supabase
        .from('streaming_logs')
        .select('content_id, plays')
        .gte('timestamp', thirtyDaysAgo);

      if (error) throw error;

      const map = {};
      for (const row of data || []) {
        map[row.content_id] = (map[row.content_id] || 0) + row.plays;
      }

      return Object.entries(map)
        .map(([content_id, total_plays]) => ({ content_id, total_plays }))
        .sort((a, b) => b.total_plays - a.total_plays)
        .slice(0, 10);
    });
  }
}

// Singleton instance
export const streamingLogAgent = new StreamingLogAgent();
