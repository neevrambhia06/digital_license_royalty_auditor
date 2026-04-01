import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, AlertTriangle, ShieldAlert, Clock, Info, ShieldX, Globe, Calendar, ArrowRight, Zap, ShieldCheck, Download } from 'lucide-react';
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
    <div className="page-container">
      <header className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h1 className="page-title">Compliance & Breach Intelligence</h1>
            <p className="page-subtitle">Automated detection of licensing violations and royalty leakage.</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <ShieldAlert size={16} className="text-crimson" />
            <span className="mono" style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>BREACH_DETECTION_ACTIVE</span>
          </div>
        </div>
        <hr className="page-rule" />
      </header>

      {/* Violation Stats */}
      <div className="metric-grid">
        <div className="metric-card">
          <div className="metric-label">
            <Globe size={12} className="text-cyan" style={{ marginRight: '8px' }} /> Territory Breach
          </div>
          <div className="metric-value text-cyan" style={{ fontSize: '32px' }}>{stats.territory}</div>
          <div style={{ marginTop: '4px', fontSize: '10px', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Unlicensed regional playback</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">
            <Calendar size={12} className="text-gold" style={{ marginRight: '8px' }} /> Term Expiration
          </div>
          <div className="metric-value text-gold" style={{ fontSize: '32px' }}>{stats.expired}</div>
          <div style={{ marginTop: '4px', fontSize: '10px', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Active play on dead license</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">
            <ShieldX size={12} className="text-crimson" style={{ marginRight: '8px' }} /> Underpaid Balance
          </div>
          <div className="metric-value text-crimson" style={{ fontSize: '32px' }}>{stats.under}</div>
          <div style={{ marginTop: '4px', fontSize: '10px', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Confirmed financial leakage</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">
            <Zap size={12} className="text-lime" style={{ marginRight: '8px' }} /> Missing Settlement
          </div>
          <div className="metric-value text-lime" style={{ fontSize: '32px' }}>{stats.missing}</div>
          <div style={{ marginTop: '4px', fontSize: '10px', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Unreconciled zero-value logs</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <div className="pill-row">
          <button className={`pill ${type === 'all' ? 'active' : ''}`} onClick={() => setType('all')}>ALL BREACHES</button>
          {types.slice(0, 5).map((t) => (
            <button key={t} className={`pill ${type === t ? 'active' : ''}`} onClick={() => setType(t)}>
              {String(t).replace('_', ' ')}
            </button>
          ))}
        </div>
        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <select className="control-select" value={severity} onChange={(e) => setSeverity(e.target.value)}>
            <option value="all">ANY SEVERITY</option>
            {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((s) => (
              <option key={s} value={s.toLowerCase()}>{s}</option>
            ))}
          </select>
          <div style={{ position: 'relative', width: '240px' }}>
            <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
            <input 
              className="control-input" 
              placeholder="Filter by description..." 
              value={q} 
              onChange={(e) => setQ(e.target.value)} 
              style={{ paddingLeft: '36px', width: '100%' }}
            />
          </div>
          <button className="btn-secondary" onClick={handleExport} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px' }}>
            <Download size={14} /> EXPORT FINDINGS
          </button>
        </div>
      </div>

      {/* Grid of Intel Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(440px, 1fr))', gap: '20px' }}>
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
                background: 'var(--bg-raised)',
                padding: '24px',
                position: 'relative',
                overflow: 'hidden'
              }}
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
                  onClick={() => toast.success(`Intelligence report for ${v.violation_id.slice(0, 8)} opened.`)}
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
    </div>
  );
}

