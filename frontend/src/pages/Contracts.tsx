import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Search, Filter, ShieldCheck, ChevronRight, FileText } from 'lucide-react';
import { auditService } from '../services/api';
import { exportToCSV } from '../utils/exportUtils';
import toast from 'react-hot-toast';

export default function Contracts() {
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState('');
  const [territory, setTerritory] = useState('all');
  const [studio, setStudio] = useState('all');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);

  useEffect(() => { 
    auditService.getContracts(1000).then(setRows); 
  }, []);

  const studios = useMemo(() => Array.from(new Set(rows.map((r) => r.studio))), [rows]);
  
  const filtered = useMemo(() => rows.filter((r) => {
    const q = search.toLowerCase();
    const text = `${r.contract_id} ${r.content_id} ${r.studio}`.toLowerCase().includes(q);
    const terr = territory === 'all' || (r.territory || []).includes(territory);
    const st = studio === 'all' || r.studio === studio;
    const isActive = new Date(r.end_date) > new Date();
    const statusOk = status === 'all' || (status === 'active' ? isActive : !isActive);
    return text && terr && st && statusOk;
  }), [rows, search, territory, studio, status]);

  const pageSize = 15;
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.ceil(filtered.length / pageSize);

  const handleExport = () => {
    exportToCSV(filtered, `DLRA_Contracts_${new Date().toISOString().slice(0,10)}`);
    toast.success('Contract intelligence exported to CSV');
  };

  return (
    <div className="page-container">
      <header className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h1 className="page-title">Contractual Intelligence Index</h1>
            <p className="page-subtitle">Authoritative repository of all active and historical licensing agreements.</p>
          </div>
          <div className="mono" style={{ fontSize: '12px', color: 'var(--gold-dim)', marginBottom: '8px' }}>
            TOTAL RECORDS: {rows.length.toLocaleString()}
          </div>
        </div>
        <hr className="page-rule" />
      </header>

      {/* Toolbar */}
      <div className="toolbar" style={{ marginBottom: '24px', background: 'var(--bg-raised)', padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-surface)' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
          <input 
            className="control-input" 
            placeholder="Search by ID or Studio..." 
            value={search} 
            onChange={(e) => { setSearch(e.target.value); setPage(1); }} 
            style={{ paddingLeft: '36px', width: '100%' }}
          />
        </div>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={14} color="var(--text-tertiary)" />
            <select className="control-select" value={territory} onChange={(e) => { setTerritory(e.target.value); setPage(1); }}>
              <option value="all">All Territories</option>
              {['US', 'CA', 'UK', 'IN', 'DE', 'JP', 'BR', 'AU', 'FR'].map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <select className="control-select" value={studio} onChange={(e) => { setStudio(e.target.value); setPage(1); }}>
            <option value="all">All Studios</option>
            {studios.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>

          <select className="control-select" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
          </select>

          <button className="btn-secondary" onClick={handleExport} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Download size={14} /> Export Intel
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-wrap">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--gold-dim)' }}>
                <th style={{ padding: '16px 24px', textAlign: 'left' }} className="metric-label">Contract / Content ID</th>
                <th style={{ padding: '16px 24px', textAlign: 'left' }} className="metric-label">Studio</th>
                <th style={{ padding: '16px 24px', textAlign: 'left' }} className="metric-label">Territory</th>
                <th style={{ padding: '16px 24px', textAlign: 'left' }} className="metric-label">Term Duration</th>
                <th style={{ padding: '16px 24px', textAlign: 'right' }} className="metric-label">Base Rate</th>
                <th style={{ padding: '16px 24px' }}></th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((r, i) => {
                const isActive = new Date(r.end_date) > new Date();
                return (
                  <tr 
                    key={r.contract_id} 
                    onClick={() => setSelected(r)} 
                    style={{ 
                      cursor: 'pointer',
                      borderBottom: '1px solid var(--border-surface)',
                      background: i % 2 === 0 ? 'transparent' : 'rgba(255,215,0,0.01)'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--gold-ghost)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'rgba(255,215,0,0.01)'}
                  >
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span className="mono" style={{ fontSize: '13px', color: 'var(--gold-bright)' }}>{r.contract_id}</span>
                        <span className="mono" style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{r.content_id}</span>
                      </div>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <span style={{ fontFamily: 'var(--font-ui)', fontSize: '13px', fontWeight: 500 }}>{r.studio}</span>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {(r.territory || []).slice(0, 3).map(t => (
                          <span key={t} className="badge missing" style={{ fontSize: '10px', padding: '2px 6px' }}>{t}</span>
                        ))}
                        {(r.territory || []).length > 3 && <span className="mono" style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>+{r.territory.length - 3}</span>}
                      </div>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span className="mono" style={{ fontSize: '11px', color: 'var(--text-primary)' }}>{r.start_date} → {r.end_date}</span>
                        <span style={{ 
                          fontSize: '10px', 
                          textTransform: 'uppercase', 
                          letterSpacing: '0.05em',
                          color: isActive ? 'var(--lime-bright)' : 'var(--crimson-mid)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          {isActive ? <ShieldCheck size={10} /> : null}
                          {isActive ? 'Active' : 'Expired'}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                      <span className="mono glow-gold" style={{ fontSize: '14px', fontWeight: 700 }}>${Number(r.rate_per_play || 0).toFixed(4)}</span>
                    </td>
                    <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                      <ChevronRight size={14} color="var(--gold-dim)" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="mono" style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
          SHOWING {((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, filtered.length)} OF {filtered.length} CONTRACTS
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            className="btn-secondary" 
            disabled={page === 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
            style={{ padding: '6px 16px', fontSize: '12px' }}
          >
            Previous
          </button>
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
              const p = i + 1;
              return (
                <button 
                  key={p} 
                  onClick={() => setPage(p)}
                  style={{ 
                    width: '32px', 
                    height: '32px', 
                    borderRadius: 'var(--radius-sm)', 
                    border: p === page ? '1px solid var(--gold-mid)' : '1px solid var(--border-subtle)',
                    background: p === page ? 'var(--gold-ghost)' : 'transparent',
                    color: p === page ? 'var(--gold-bright)' : 'var(--text-tertiary)',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px'
                  }}
                >
                  {p}
                </button>
              );
            })}
          </div>
          <button 
            className="btn-secondary" 
            disabled={page === totalPages}
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            style={{ padding: '6px 16px', fontSize: '12px' }}
          >
            Next
          </button>
        </div>
      </div>

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
                  <FileText size={20} className="text-gold" />
                  <span className="metric-label" style={{ margin: 0, fontSize: '11px' }}>CONTRACT SPECIFICATION</span>
                </div>
                <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '32px', color: 'var(--text-primary)', margin: '0 0 4px' }}>{selected.studio}</h2>
                <div className="mono" style={{ color: 'var(--gold-bright)', fontSize: '14px' }}>{selected.contract_id}</div>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '40px' }}>
                  <div className="metric-card" style={{ padding: '16px' }}>
                    <div className="metric-label" style={{ fontSize: '10px' }}>ROYALTY RATE</div>
                    <div className="mono" style={{ fontSize: '20px', color: 'var(--gold-bright)' }}>{typeof selected.royalty_rate === 'number' ? `${(selected.royalty_rate * 100).toFixed(1)}%` : selected.royalty_rate}</div>
                  </div>
                  <div className="metric-card" style={{ padding: '16px' }}>
                    <div className="metric-label" style={{ fontSize: '10px' }}>BASE RATE / PLAY</div>
                    <div className="mono" style={{ fontSize: '20px', color: 'var(--cyan-bright)' }}>${selected.rate_per_play}</div>
                  </div>
                  <div className="metric-card" style={{ padding: '16px' }}>
                    <div className="metric-label" style={{ fontSize: '10px' }}>MIN. GUARANTEE</div>
                    <div className="mono" style={{ fontSize: '20px', color: 'var(--lime-bright)' }}>${(selected.minimum_guarantees || 0).toLocaleString()}</div>
                  </div>
                  <div className="metric-card" style={{ padding: '16px' }}>
                    <div className="metric-label" style={{ fontSize: '10px' }}>TIERED KICKER</div>
                    <div className="mono" style={{ fontSize: '20px', color: 'var(--text-tertiary)' }}>{selected.tier_rate || 'N/A'}</div>
                  </div>
                </div>

                <div className="panel" style={{ background: 'var(--bg-void)', marginBottom: '32px' }}>
                  <div className="metric-label" style={{ marginBottom: '16px' }}>Territory Enforcement</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {(selected.territory || []).map((t) => (
                      <span key={t} className="badge missing" style={{ fontSize: '12px', padding: '6px 12px' }}>{t}</span>
                    ))}
                  </div>
                </div>

                <div className="panel" style={{ background: 'var(--bg-void)' }}>
                  <div className="metric-label" style={{ marginBottom: '16px' }}>Legal Provisions</div>
                  <p style={{ 
                    fontFamily: 'var(--font-body)', 
                    fontSize: '14px', 
                    lineHeight: '1.8', 
                    color: 'var(--text-secondary)',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {selected.contract_text || 'Synthesizing contract provisions...'}
                    {"\n\n"}
                    The above metadata has been extracted using DLRA's agentic parsing engine. This contract is subject to automated audit batches on a 30-day rolling window.
                  </p>
                </div>
              </div>

              <div style={{ padding: '24px 32px', borderTop: '1px solid var(--border-surface)', background: 'var(--bg-raised)' }}>
                <button 
                  className="btn-secondary" 
                  style={{ width: '100%', padding: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}
                  onClick={() => toast.loading('Reviewing contract clauses...')}
                >
                  <Search size={14} /> Run Deep Analysis
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

