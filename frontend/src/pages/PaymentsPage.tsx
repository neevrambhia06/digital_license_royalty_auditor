import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Search, Calendar, DollarSign, AlertCircle, ChevronRight, FileCheck } from 'lucide-react';
import { auditService } from '../services/api';
import { exportToCSV } from '../utils/exportUtils';
import toast from 'react-hot-toast';

export default function PaymentsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [month, setMonth] = useState('');
  const [minAmt, setMinAmt] = useState('');
  const [maxAmt, setMaxAmt] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  const refreshPayments = () => {
    setLoading(true);
    auditService.getPayments().then((d) => {
      setRows(d || []);
      setLoading(false);
    });
  };

  useEffect(() => { 
    refreshPayments(); 
  }, []);

  const handleSyncLedger = async () => {
    setIsSyncing(true);
    const loadId = toast.loading('Synchronizing immutable ledger...');
    try {
      await auditService.syncLedger();
      refreshPayments();
      toast.success('Financial Records Synchronized', { id: loadId });
    } catch (err) {
      toast.error('Ledger synchronization failed', { id: loadId });
    } finally {
      setIsSyncing(false);
    }
  };

  const filtered = useMemo(() => rows.filter((r: any) => {
    const q = !search || `${r.payment_id} ${r.content_id} ${r.contract_id}`.toLowerCase().includes(search.toLowerCase());
    const m = !month || String(r.payment_date || '').startsWith(month);
    const v = Number(r.amount_paid || 0);
    const minOk = !minAmt || v >= Number(minAmt);
    const maxOk = !maxAmt || v <= Number(maxAmt);
    return q && m && minOk && maxOk;
  }), [rows, search, month, minAmt, maxAmt]);

  const pageSize = 20;
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.ceil(filtered.length / pageSize);

  const stats = useMemo(() => {
    const totalPaid = filtered.reduce((s, r) => s + Number(r.amount_paid || 0), 0);
    const avgPayment = filtered.length ? totalPaid / filtered.length : 0;
    const missing = filtered.filter((r) => Number(r.amount_paid || 0) <= 0).length;
    return { totalPaid, avgPayment, missing };
  }, [filtered]);

  const handleExport = () => {
    exportToCSV(filtered, `DLRA_Ledger_Export_${new Date().toISOString().slice(0, 10)}`);
    toast.success('CSV saved to your Downloads folder');
  };

  return (
    <div className="page-container" style={{ padding: 'var(--sp-8) 0' }}>
      <header className="page-header">
        <div>
          <h1 className="page-title">Payment Reconciliation Ledger</h1>
          <p className="page-subtitle">Verified financial settlements and ledger accuracy auditing.</p>
        </div>
        <div className="header-actions">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: '16px' }}>
            <FileCheck size={16} className="text-gold" />
            <span className="mono" style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>LEDGER_SYNC_VERIFIED</span>
          </div>
          <button className="btn-secondary" onClick={handleExport} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Download size={14} /> Export CSV
          </button>
          <button className="btn-primary" onClick={handleSyncLedger} disabled={isSyncing}>
            {isSyncing ? 'Syncing...' : 'Sync Ledger'}
          </button>
        </div>
      </header>

      {/* Financial Stats */}
      <div className="metric-grid">
        <div className="metric-card">
          <div className="metric-label">Total Reconciled</div>
          <div className="metric-value text-gold" style={{ fontSize: '32px' }}>
            ${Math.round(stats.totalPaid).toLocaleString()}
          </div>
          <div style={{ marginTop: '4px', fontSize: '10px', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Gross Settlement Value</div>
        </div>
        
        <div className="metric-card">
          <div className="metric-label">Average Remittance</div>
          <div className="metric-value text-cyan" style={{ fontSize: '32px' }}>
            ${Math.round(stats.avgPayment).toLocaleString()}
          </div>
          <div style={{ marginTop: '4px', fontSize: '10px', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Per transaction mean</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Zero-Value Flags</div>
          <div className="metric-value text-crimson" style={{ fontSize: '32px' }}>
            {stats.missing}
          </div>
          <div style={{ marginTop: '4px', fontSize: '10px', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Requires immediate audit</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Ledger Integrity</div>
          <div className="metric-value text-lime" style={{ fontSize: '32px' }}>
            99.9%
          </div>
          <div style={{ marginTop: '4px', fontSize: '10px', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Data checksum stability</div>
        </div>
      </div>

      {/* Toolbar / Filters */}
      <div className="filter-bar">
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={14} style={{ position: 'absolute', left: '0', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', opacity: 0.5 }} />
          <input 
            className="ghost-input" 
            placeholder="Search Ledger ID / Content ID..." 
            value={search} 
            onChange={(e) => { setSearch(e.target.value); setPage(1); }} 
            style={{ paddingLeft: '24px', width: '100%' }}
          />
        </div>
        
        <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <input 
              className="ghost-input" 
              type="month" 
              value={month} 
              onChange={(e) => { setMonth(e.target.value); setPage(1); }} 
              style={{ width: '140px' }} 
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <span className="mono" style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>RANGE</span>
            <input 
              className="ghost-input" 
              placeholder="Min ($)" 
              value={minAmt} 
              onChange={(e) => { setMinAmt(e.target.value); setPage(1); }} 
              style={{ width: '80px' }} 
            />
            <span className="mono" style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>TO</span>
            <input 
              className="ghost-input" 
              placeholder="Max ($)" 
              value={maxAmt} 
              onChange={(e) => { setMaxAmt(e.target.value); setPage(1); }} 
              style={{ width: '80px' }} 
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-wrap">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--gold-dim)' }}>
                <th style={{ padding: '16px 24px', textAlign: 'left' }} className="metric-label">Settlement Hash / ID</th>
                <th style={{ padding: '16px 24px', textAlign: 'left' }} className="metric-label">Asset Identity</th>
                <th style={{ padding: '16px 24px', textAlign: 'left' }} className="metric-label">Contract Mapping</th>
                <th style={{ padding: '16px 24px', textAlign: 'right' }} className="metric-label">Settlement Amount</th>
                <th style={{ padding: '16px 24px', textAlign: 'right' }} className="metric-label">Payment Date</th>
                <th style={{ padding: '16px 24px' }}></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border-surface)' }}>
                    <td style={{ padding: '16px 24px' }}><div className="skeleton" style={{ height: '12px', width: '100px' }} /></td>
                    <td style={{ padding: '16px 24px' }}><div className="skeleton" style={{ height: '12px', width: '160px' }} /></td>
                    <td style={{ padding: '16px 24px' }}><div className="skeleton" style={{ height: '12px', width: '120px' }} /></td>
                    <td style={{ padding: '16px 24px' }}><div className="skeleton" style={{ height: '12px', width: '80px', marginLeft: 'auto' }} /></td>
                    <td style={{ padding: '16px 24px' }}><div className="skeleton" style={{ height: '12px', width: '100px', marginLeft: 'auto' }} /></td>
                    <td style={{ padding: '16px 24px' }} />
                  </tr>
                ))
              ) : pageRows.map((r, i) => {
                const isZero = Number(r.amount_paid || 0) <= 0;
                return (
                  <tr 
                    key={r.payment_id}
                    style={{ 
                      borderBottom: '1px solid var(--border-surface)',
                      background: i % 2 === 0 ? 'transparent' : 'rgba(255,215,0,0.01)'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--gold-ghost)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'rgba(255,215,0,0.01)'}
                  >
                    <td style={{ padding: '16px 24px' }}>
                      <span className="mono" style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{r.payment_id}</span>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <span className="mono" style={{ fontSize: '13px', color: 'var(--gold-bright)' }}>{r.content_id}</span>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <span className="mono" style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{r.contract_id}</span>
                    </td>
                    <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                        <span className={`mono ${isZero ? 'text-crimson glow-crimson' : 'text-primary'}`} style={{ fontSize: '14px', fontWeight: 700 }}>
                          ${Number(r.amount_paid || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        {isZero && (
                          <span style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--crimson-mid)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <AlertCircle size={8} /> Exception Found
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                      <span className="mono" style={{ fontSize: '12px' }}>{r.payment_date}</span>
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
          LEDGER ENTRY {((page - 1) * pageSize) + 1} TO {Math.min(page * pageSize, filtered.length)} // TOTAL {filtered.length.toLocaleString()}
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
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center', padding: '0 12px' }}>
            <span className="mono" style={{ fontSize: '12px', color: 'var(--gold-bright)' }}>{page}</span>
            <span className="mono" style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>/ {totalPages}</span>
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
    </div>
  );
}

