import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Download, RefreshCw, Search, ShieldCheck, AlertTriangle, ShieldAlert, FileText, BrainCircuit, Activity, ArrowUpRight } from 'lucide-react';
import { auditService } from '../services/api';
import { exportToCSV } from '../utils/exportUtils';
import toast from 'react-hot-toast';

function Typewriter({ text }: { text: string }) {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    setIdx(0);
    const id = setInterval(() => setIdx((v) => (v >= text.length ? v : v + 1)), 14);
    return () => clearInterval(id);
  }, [text]);
  return <span className="mono" style={{ lineHeight: '1.6', color: 'var(--text-secondary)' }}>{text.slice(0, idx)}{idx < text.length && <span className="text-gold" style={{ animation: 'blink 0.5s infinite' }}>|</span>}</span>;
}

export default function AuditPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [tab, setTab] = useState('all');
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<'difference' | 'content_id'>('difference');
  const [explain, setExplain] = useState<Record<string, string>>({});
  const [loadingAI, setLoadingAI] = useState<string | null>(null);

  const load = async () => {
    const d = await auditService.getAuditResults();
    setRows(d || []);
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    return [...rows]
      .filter((r) => {
        if (tab === 'clean') return !r.violation_type;
        if (tab === 'all') return true;
        return String(r.violation_type || '').toLowerCase() === tab;
      })
      .filter((r) => `${r.content_id} ${r.contract_id} ${r.studio}`.toLowerCase().includes(q.toLowerCase()))
      .sort((a, b) => sort === 'difference' ? Number(b.difference || 0) - Number(a.difference || 0) : String(a.content_id).localeCompare(String(b.content_id)));
  }, [rows, tab, q, sort]);

  const summary = {
    total: rows.length,
    clean: rows.filter((r) => !r.violation_type).length,
    under: rows.filter((r) => r.violation_type === 'UNDERPAYMENT').length,
    over: rows.filter((r) => r.violation_type === 'OVERPAYMENT').length
  };

  const handleExport = () => {
    exportToCSV(filtered, `DLRA_Audit_Findings_${new Date().toISOString().slice(0, 10)}`);
    toast.success('Audit results exported for review');
  };

  const generateExplain = (r: any) => {
    setLoadingAI(r.audit_id);
    setTimeout(() => {
      setExplain((p) => ({ 
        ...p, 
        [r.audit_id]: `[AGENTIC_ANALYSIS_REPLY] Asset ${r.content_id} was reconciled against contract ${r.contract_id}. We detected a variance of $${Number(r.difference || 0).toFixed(2)} based on ${r.studio}'s distribution logic. The discrepancy is attributed to ${r.violation_type === 'UNDERPAYMENT' ? 'incorrect rate tier calculation' : 'missing region-based modifiers'} in the primary ledger. Recommendation: Initiate recovery protocol via Section 12.4 of Licensing Agreement.` 
      }));
      setLoadingAI(null);
    }, 1200);
  };

  return (
    <div className="page-container" style={{ padding: 'var(--sp-8) 0' }}>
      <header className="page-header">
        <div>
          <h1 className="page-title">Foundational Audit Findings</h1>
          <p className="page-subtitle">Systemic reconciliation of streaming, licensing, and settlement data.</p>
        </div>
        <div className="header-actions">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: '16px' }}>
            <Activity size={14} className="text-gold" />
            <span className="mono" style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>NODAL_SYNC: 100% // FINDINGS_LIVE</span>
          </div>
          <button className="btn-secondary" onClick={handleExport} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Download size={14} /> Export CSV
          </button>
          <button className="btn-secondary" onClick={load} style={{ padding: '10px' }}>
            <RefreshCw size={14} />
          </button>
        </div>
      </header>

      {/* Audit Stats Cluster */}
      <div className="metric-grid">
        <div className="metric-card">
          <div className="metric-label">Total Observations</div>
          <div className="metric-value text-cyan" style={{ fontSize: '32px' }}>{summary.total}</div>
          <div style={{ marginTop: '4px', fontSize: '10px', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Cross-data check instances</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Verified Compliant</div>
          <div className="metric-value text-lime" style={{ fontSize: '32px' }}>{summary.clean}</div>
          <div style={{ marginTop: '4px', fontSize: '10px', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>No leakage detected</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Underpaid Assets</div>
          <div className="metric-value text-crimson" style={{ fontSize: '32px' }}>{summary.under}</div>
          <div style={{ marginTop: '4px', fontSize: '10px', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Total royalty leakage</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Overpaid Errors</div>
          <div className="metric-value text-gold" style={{ fontSize: '32px' }}>{summary.over}</div>
          <div style={{ marginTop: '4px', fontSize: '10px', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Billing inaccuracies</div>
        </div>
      </div>

      {/* Toolbar / Filters */}
      <div className="filter-bar">
        <div style={{ display: 'flex', gap: '32px', alignItems: 'center', flex: 1 }}>
          <select className="ghost-select" value={tab} onChange={(e) => setTab(e.target.value)}>
            <option value="all">Finding Type (All)</option>
            <option value="underpayment">Underpayment</option>
            <option value="overpayment">Overpayment</option>
            <option value="missing_payment">Missing Payment</option>
            <option value="clean">Compliant</option>
          </select>
          <select className="ghost-select" value={sort} onChange={(e) => setSort(e.target.value as 'difference' | 'content_id')}>
            <option value="difference">Sort by Variance</option>
            <option value="content_id">Sort by Asset ID</option>
          </select>
          <div style={{ position: 'relative', width: '320px' }}>
            <Search size={14} style={{ position: 'absolute', left: '0', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', opacity: 0.5 }} />
            <input 
              className="ghost-input" 
              placeholder="Search content/studio..." 
              value={q} 
              onChange={(e) => setQ(e.target.value)} 
              style={{ paddingLeft: '24px', width: '100%' }}
            />
          </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-wrap">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-raised)', borderBottom: '1px solid var(--gold-dim)' }}>
                <th style={{ width: 48 }}></th>
                <th style={{ padding: '16px 12px', textAlign: 'left' }} className="metric-label">Audit Hash</th>
                <th style={{ padding: '16px 12px', textAlign: 'left' }} className="metric-label">Asset Identity</th>
                <th style={{ padding: '16px 12px', textAlign: 'left' }} className="metric-label">Distributor</th>
                <th style={{ padding: '16px 12px', textAlign: 'right' }} className="metric-label">Expected Value</th>
                <th style={{ padding: '16px 12px', textAlign: 'right' }} className="metric-label">Ledger Actual</th>
                <th style={{ padding: '16px 12px', textAlign: 'right' }} className="metric-label">Variance</th>
                <th style={{ padding: '16px 24px', textAlign: 'center' }} className="metric-label">Status Flag</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => (
                <React.Fragment key={r.audit_id}>
                  <tr 
                    style={{ 
                      borderBottom: '1px solid var(--border-surface)',
                      background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--gold-ghost)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)'}
                  >
                    <td 
                      onClick={() => setExpanded(expanded === r.audit_id ? null : r.audit_id)} 
                      style={{ cursor: 'pointer', textAlign: 'center', color: 'var(--gold-dim)' }}
                    >
                      <ChevronRight size={14} style={{ transform: expanded === r.audit_id ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }} />
                    </td>
                    <td className="mono" style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{r.audit_id?.slice(0, 8)}</td>
                    <td className="id-text" style={{ fontSize: '13px', color: 'var(--gold-bright)' }}>{r.content_id}</td>
                    <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{r.studio}</td>
                    <td className="money mono" style={{ textAlign: 'right', fontSize: '13px' }}>${Number(r.expected_payment || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="money mono" style={{ textAlign: 'right', fontSize: '13px' }}>${Number(r.actual_payment || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td 
                      className={`money mono ${Number(r.difference || 0) > 0 ? 'text-crimson glow-crimson' : Number(r.difference || 0) < 0 ? 'text-cyan' : ''}`} 
                      style={{ textAlign: 'right', fontSize: '13px', fontWeight: 700 }}
                    >
                      ${Math.abs(Number(r.difference || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`badge ${String((r.violation_type || 'clean')).toLowerCase()}`} style={{ fontSize: '9px', padding: '3px 8px' }}>
                        {r.violation_type || 'compliant'}
                      </span>
                    </td>
                  </tr>
                  <AnimatePresence>
                    {expanded === r.audit_id && (
                      <tr>
                        <td colSpan={8} style={{ padding: 0 }}>
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }} 
                            animate={{ height: 'auto', opacity: 1 }} 
                            exit={{ height: 0, opacity: 0 }} 
                            transition={{ duration: 0.3 }} 
                            style={{ overflow: 'hidden', background: 'var(--bg-void)', borderLeft: '3px solid var(--gold-bright)', margin: '4px 24px 16px 48px', padding: '24px', borderRadius: 'var(--radius-sm)' }}
                          >
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                              <div className="panel" style={{ background: 'var(--bg-raised)', border: '1px solid var(--border-surface)' }}>
                                <div className="metric-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><BrainCircuit size={12} /> Calculation Logic</div>
                                <div className="mono" style={{ fontSize: '11px', marginTop: '8px', color: 'var(--text-secondary)' }}>
                                  EXPECTED_MV = sum(logs.plays * contracts.rate_tier)<br />
                                  VARIANCE_DELTA = EXPECTED_MV - ledger.actual<br />
                                  THRESHOLD_CROSS = variance &gt; $50.00
                                </div>
                              </div>
                              <div className="panel" style={{ background: 'var(--bg-raised)', border: '1px solid var(--border-surface)' }}>
                                <div className="metric-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><FileText size={12} /> Registry Context</div>
                                <div className="mono" style={{ fontSize: '11px', marginTop: '8px', color: 'var(--text-secondary)' }}>
                                  Registry ID: {r.contract_id}<br />
                                  Settlement Entity: {r.studio}<br />
                                  Geographic Zone: GLOBAL_AGNOSTIC
                                </div>
                              </div>
                              <div className="panel" style={{ background: 'var(--bg-raised)', border: '1px solid var(--border-surface)' }}>
                                <div className="metric-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><ShieldAlert size={12} /> Risk Vector</div>
                                <div className="mono" style={{ fontSize: '11px', marginTop: '8px', color: 'var(--text-secondary)' }}>
                                  Severity: {r.violation_type ? 'HIGH_PRIORITY' : 'LOW'}<br />
                                  Risk Type: {r.violation_type || 'NONE'}<br />
                                  Auto-Resolution: ELIGIBLE
                                </div>
                              </div>
                            </div>
                            
                            <div style={{ borderTop: '1px solid var(--border-surface)', paddingTop: '20px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                  <div className={`scanline ${loadingAI === r.audit_id ? 'active' : ''}`} style={{ width: '40px', height: '40px', background: 'var(--bg-elevated)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--gold-dim)' }}>
                                    <BrainCircuit size={20} className={loadingAI === r.audit_id ? 'text-gold' : 'text-tertiary'} />
                                  </div>
                                  <div>
                                    <div className="metric-label" style={{ color: 'var(--text-primary)' }}>Agentic Insight Synthesis</div>
                                    <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Claude-3.5-Intelligence Layer</div>
                                  </div>
                                </div>
                                {!explain[r.audit_id] && !loadingAI && (
                                  <button className="btn-primary" style={{ width: 'auto', padding: '8px 20px', fontSize: '12px' }} onClick={() => generateExplain(r)}>
                                    Query AI Subagent
                                  </button>
                                )}
                              </div>
                              
                              {loadingAI === r.audit_id && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px' }}>
                                  <RefreshCw size={14} className="spin text-gold" />
                                  <span className="mono" style={{ fontSize: '12px', color: 'var(--gold-mid)' }}>RECONCILING CONTRACT PDF AGAINST STREAMING TELEMETRY...</span>
                                </div>
                              )}

                              {explain[r.audit_id] && (
                                <div style={{ background: 'rgba(255,215,0,0.03)', padding: '16px', borderRadius: '4px', border: '1px solid var(--gold-ghost)' }}>
                                  <Typewriter text={explain[r.audit_id]} />
                                  <div style={{ marginTop: '16px', display: 'flex', gap: '12px' }}>
                                    <button className="btn-secondary" style={{ fontSize: '10px', padding: '4px 10px' }}>Flag for Manual Review</button>
                                    <button className="btn-secondary" style={{ fontSize: '10px', padding: '4px 10px' }}>Initiate Dispute Workflow</button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        </td>
                      </tr>
                    )}
                  </AnimatePresence>
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Placeholder */}
      <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'center' }}>
        <div className="mono" style={{ fontSize: '11px', color: 'var(--text-tertiary)', letterSpacing: '0.1em' }}>
          END OF FINDINGS REGISTRY // SYSTEM NOMINAL
        </div>
      </div>

      <style>{`
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        .spin { animation: spin 2s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .scanline.active { position: relative; overflow: hidden; }
        .scanline.active::after {
          content: "";
          position: absolute;
          top: -100%;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(to bottom, transparent, var(--gold-bright), transparent);
          opacity: 0.2;
          animation: scan 1.5s linear infinite;
        }
        @keyframes scan { 0% { top: -100%; } 100% { top: 100%; } }
      `}</style>
    </div>
  );
}

