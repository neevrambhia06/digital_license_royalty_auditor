import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, AlertTriangle, ShieldAlert, Clock, Info, ShieldX, Globe, Calendar, ArrowRight, Zap, ShieldCheck, Download, X } from 'lucide-react';
import { auditService } from '../services/api';
import { exportToCSV } from '../utils/exportUtils';
import toast from 'react-hot-toast';

export default function ViolationsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [type, setType] = useState('all');
  const [severity, setSeverity] = useState('all');
  const [q, setQ] = useState('');

  useEffect(() => { 
    auditService.getViolations(2000).then((d) => setRows(d || [])); 
  }, []);

  const types = useMemo(() => Array.from(new Set(rows.map((r) => r.violation_type))), [rows]);

  const filtered = useMemo(() => rows.filter((r: any) =>
    (type === 'all' || r.violation_type === type) &&
    (severity === 'all' || r.severity === severity) &&
    `${r.content_id} ${r.contract_id} ${r.description}`.toLowerCase().includes(q.toLowerCase())
  ), [rows, type, severity, q]);

  const [selected, setSelected] = useState<any>(null);

  const stats = useMemo(() => ({
    territory: rows.filter((r) => String(r.violation_type).includes('TERRITORY')).length,
    expired: rows.filter((r) => String(r.violation_type).includes('EXPIRED')).length,
    under: rows.filter((r) => String(r.violation_type).includes('UNDERPAYMENT')).length,
    missing: rows.filter((r) => String(r.violation_type).includes('MISSING')).length
  }), [rows]);

  const handleExport = () => {
    exportToCSV(filtered, `DLRA_Violations_Export_${new Date().toISOString().slice(0, 10)}`);
    toast.success('Violations exported successfully');
  };

  return (
    <div className="page-container" style={{ padding: 'var(--sp-8) 0' }}>
      <header className="page-header">
        <div>
          <h1 className="page-title">Compliance & Breach Intelligence</h1>
          <p className="page-subtitle">Automated detection of licensing violations and royalty leakage.</p>
        </div>
        <div className="header-actions">
          <button className="btn-secondary" onClick={handleExport} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Download size={14} /> Export Findings
          </button>
          <button className="btn-primary">Resolve All</button>
        </div>
      </header>

      {/* Violation Stats */}
      <div className="metric-grid">
        <div className="metric-card">
          <div style={{ position: 'absolute', top: '16px', right: '16px' }}>
            <Globe size={14} className="text-cyan" />
          </div>
          <span className="metric-label" style={{ marginBottom: '8px' }}>Territory Breach</span>
          <div className="metric-value text-cyan" style={{ fontSize: '32px', fontWeight: 800 }}>{stats.territory}</div>
          <div className="mono" style={{ marginTop: '16px', fontSize: '9px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Unlicensed Playback
          </div>
        </div>
        <div className="metric-card">
          <div style={{ position: 'absolute', top: '16px', right: '16px' }}>
            <Calendar size={14} className="text-gold" />
          </div>
          <span className="metric-label" style={{ marginBottom: '8px' }}>Term Expiration</span>
          <div className="metric-value text-gold" style={{ fontSize: '32px', fontWeight: 800 }}>{stats.expired}</div>
          <div className="mono" style={{ marginTop: '16px', fontSize: '9px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Dead License Play
          </div>
        </div>
        <div className="metric-card">
          <div style={{ position: 'absolute', top: '16px', right: '16px' }}>
            <ShieldX size={14} className="text-crimson" />
          </div>
          <span className="metric-label" style={{ marginBottom: '8px' }}>Underpaid</span>
          <div className="metric-value text-crimson" style={{ fontSize: '32px', fontWeight: 800 }}>{stats.under}</div>
          <div className="mono" style={{ marginTop: '16px', fontSize: '9px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Financial Leakage
          </div>
        </div>
        <div className="metric-card">
          <div style={{ position: 'absolute', top: '16px', right: '16px' }}>
            <Zap size={14} className="text-lime" />
          </div>
          <span className="metric-label" style={{ marginBottom: '8px' }}>Missing Settlement</span>
          <div className="metric-value text-lime" style={{ fontSize: '32px', fontWeight: 800 }}>{stats.missing}</div>
          <div className="mono" style={{ marginTop: '16px', fontSize: '9px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Unreconciled Logs
          </div>
        </div>
      </div>

      {/* Toolbar / Filters */}
      <div className="filter-bar">
        <div style={{ display: 'flex', gap: '32px', alignItems: 'center', flex: 1 }}>
          <select className="ghost-select" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="all">Breach Typology (All)</option>
            {types.map((t) => (
              <option key={t} value={t}>{String(t).replace('_', ' ')}</option>
            ))}
          </select>
          <select className="ghost-select" value={severity} onChange={(e) => setSeverity(e.target.value)}>
            <option value="all">Severity Degree (Any)</option>
            {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((s) => (
              <option key={s} value={s.toLowerCase()}>{s}</option>
            ))}
          </select>
          <div style={{ position: 'relative', width: '320px' }}>
            <Search size={14} style={{ position: 'absolute', left: '0', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', opacity: 0.5 }} />
            <input 
              className="ghost-input" 
              placeholder="Search Intelligence..." 
              value={q} 
              onChange={(e) => setQ(e.target.value)} 
              style={{ paddingLeft: '24px', width: '100%' }}
            />
          </div>
        </div>
      </div>

      {/* Grid of Intel Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))', gap: '24px' }}>
        <AnimatePresence>
          {filtered.map((v, i) => (
            <motion.div 
              key={v.violation_id} 
              className="panel" 
              layout
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: Math.min(i * 0.05, 0.4) }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--gold-mid)'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-surface)'}
              style={{ 
                border: '1px solid var(--border-surface)',
                background: 'var(--bg-surface)',
                padding: '32px',
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
              }}
              onClick={() => setSelected(v)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <span className={`badge ${String(v.violation_type || '').toLowerCase()}`} style={{ fontSize: '10px', padding: '4px 10px' }}>
                  {v.violation_type}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {v.severity === 'critical' && <AlertTriangle size={14} className="text-crimson" />}
                  <span className={`badge ${String(v.severity || '').toLowerCase()}-severity`} style={{ 
                    fontSize: '9px', 
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: '4px',
                    letterSpacing: '0.5px'
                  }}>
                    {v.severity?.toUpperCase()}
                  </span>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span className="mono" style={{ fontSize: '14px', color: 'var(--gold-bright)', fontWeight: 600 }}>{v.content_id}</span>
                  <ArrowRight size={12} color="var(--text-tertiary)" />
                  <span className="mono" style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{v.contract_id}</span>
                </div>
                <p style={{ 
                  fontFamily: 'var(--font-heading-refined)', 
                  fontSize: '15px', 
                  lineHeight: '1.6', 
                  color: 'var(--text-secondary)',
                  margin: 0
                }}>
                  {v.description}
                </p>
              </div>

              <div style={{ borderTop: '1px dotted var(--border-subtle)', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-tertiary)' }}>
                  <Clock size={12} />
                  <span className="mono" style={{ fontSize: '11px' }}>
                    {new Date(v.detected_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}
                  </span>
                </div>
                <button 
                  className="btn-secondary" 
                  style={{ fontSize: '10px', padding: '6px 12px', borderColor: 'var(--gold-dim)' }}
                  onClick={(e) => { e.stopPropagation(); setSelected(v); }}
                >
                  Inspect Incident
                </button>
              </div>

              {/* Status Graphic */}
              <div style={{ position: 'absolute', right: '-10px', bottom: '-10px', opacity: 0.03, pointerEvents: 'none' }}>
                <ShieldAlert size={120} />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '80px 0', opacity: 0.5 }}>
          <ShieldCheck size={48} style={{ margin: '0 auto 16px', color: 'var(--lime-bright)' }} />
          <p className="page-subtitle">No compliance breaches detected for the selected filters.</p>
        </div>
      )}

      {/* Detail Sidebar */}
      <AnimatePresence>
        {selected && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setSelected(null)} 
              style={{ position: 'fixed', inset: 0, background: 'rgba(5,5,10,0.85)', backdropFilter: 'blur(8px)', zIndex: 100 }} 
            />
            <motion.aside 
              initial={{ x: 600, opacity: 0 }} 
              animate={{ x: 0, opacity: 1 }} 
              exit={{ x: 600, opacity: 0 }} 
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="panel"
              style={{ 
                position: 'fixed', 
                top: 0, 
                right: 0, 
                bottom: 0, 
                width: '560px', 
                zIndex: 101, 
                borderRadius: 0, 
                margin: 0,
                borderLeft: '1px solid var(--gold-dim)',
                background: 'var(--bg-surface)',
                display: 'flex',
                flexDirection: 'column',
                padding: 0,
                boxShadow: '-20px 0 60px rgba(0,0,0,0.5)'
              }}
            >
              <div style={{ padding: '32px', borderBottom: '1px solid var(--border-surface)', background: 'var(--bg-raised)' }}>
                <button className="btn-secondary" onClick={() => setSelected(null)} style={{ float: 'right', padding: '8px' }}><X size={16} /></button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <ShieldAlert size={20} className="text-crimson" />
                  <span className="metric-label" style={{ margin: 0, fontSize: '11px' }}>COMPLIANCE INCIDENT REPORT</span>
                </div>
                <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '28px', color: 'var(--text-primary)', margin: '0 0 4px', lineHeight: 1.2 }}>{selected.violation_type?.replace('_', ' ')}</h2>
                <div className="mono" style={{ color: 'var(--crimson-mid)', fontSize: '14px' }}>{selected.violation_id}</div>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
                <div className="metric-card" style={{ marginBottom: '32px', borderLeft: '4px solid var(--crimson-mid)' }}>
                  <div className="metric-label">Detection Log</div>
                  <p style={{ margin: '8px 0 0', lineHeight: 1.6 }}>{selected.description}</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '32px' }}>
                  <div className="panel" style={{ padding: '20px', background: 'var(--bg-void)' }}>
                    <div className="metric-label" style={{ fontSize: '9px' }}>SEVERITY</div>
                    <div className={`mono ${selected.severity}-severity`} style={{ fontSize: '18px', fontWeight: 800 }}>{selected.severity?.toUpperCase()}</div>
                  </div>
                  <div className="panel" style={{ padding: '20px', background: 'var(--bg-void)' }}>
                    <div className="metric-label" style={{ fontSize: '9px' }}>DETECTED AT</div>
                    <div className="mono" style={{ fontSize: '14px' }}>{new Date(selected.detected_at).toLocaleDateString()}</div>
                  </div>
                </div>

                <div className="panel" style={{ background: 'var(--bg-void)', marginBottom: '32px' }}>
                  <div className="metric-label" style={{ marginBottom: '16px' }}>Impacted Entities</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="metric-label" style={{ fontSize: '10px' }}>CONTENT ID</span>
                      <span className="mono text-gold">{selected.content_id}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="metric-label" style={{ fontSize: '10px' }}>CONTRACT ID</span>
                      <span className="mono text-cyan">{selected.contract_id}</span>
                    </div>
                  </div>
                </div>

                <div className="panel" style={{ border: '1px dashed var(--gold-dim)', background: 'rgba(255,215,0,0.02)' }}>
                  <div className="metric-label" style={{ color: 'var(--gold-bright)' }}>Recommended Remediation</div>
                  <p style={{ fontSize: '13px', lineHeight: 1.6, marginTop: '8px' }}>
                    Agentic analysis recommends immediate suspension of content distribution in the flagged region and a back-audit of all royalty settlements for the past 90 days.
                  </p>
                </div>
              </div>

              <div style={{ padding: '24px 32px', borderTop: '1px solid var(--border-surface)', background: 'var(--bg-raised)', display: 'flex', gap: '12px' }}>
                 <button className="btn-secondary" style={{ flex: 1 }}>Ignore</button>
                 <button className="btn-primary" style={{ flex: 1 }} onClick={() => toast.success('Remediation workflow initiated.')}>Initiate Resolve</button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

