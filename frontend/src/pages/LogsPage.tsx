import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Monitor, Smartphone, Tv, Tablet, Download, Search, Globe, User, Clock, Database, ChevronRight } from 'lucide-react';
import { auditService } from '../services/api';
import { exportToCSV } from '../utils/exportUtils';
import toast from 'react-hot-toast';

const flags: Record<string, string> = { US: '🇺🇸', CA: '🇨🇦', UK: '🇬🇧', IN: '🇮🇳', DE: '🇩🇪', JP: '🇯🇵', BR: '🇧🇷', AU: '🇦🇺', FR: '🇫🇷' };
const iconByDevice: Record<string, React.ReactNode> = { desktop: <Monitor size={14} />, mobile: <Smartphone size={14} />, tv: <Tv size={14} />, tablet: <Tablet size={14} /> };

function AgenticToggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <span className="metric-label" style={{ margin: 0, fontSize: '11px' }}>{label}</span>
      <button 
        onClick={() => onChange(!value)} 
        style={{ 
          width: 44, 
          height: 24, 
          borderRadius: 12, 
          background: value ? 'var(--gold-mid)' : 'var(--bg-void)', 
          border: '1px solid var(--gold-dim)', 
          position: 'relative', 
          cursor: 'pointer',
          padding: 0,
          transition: 'all 0.3s'
        }}
      >
        <motion.div 
          animate={{ x: value ? 22 : 2 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          style={{ 
            width: 18, 
            height: 18, 
            borderRadius: '50%', 
            background: value ? 'var(--bg-void)' : 'var(--gold-bright)',
            position: 'absolute',
            top: 2
          }} 
        />
      </button>
    </div>
  );
}

export default function LogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [agg, setAgg] = useState(false);
  const [search, setSearch] = useState('');
  const [country, setCountry] = useState('all');
  const [userType, setUserType] = useState('all');
  const [device, setDevice] = useState('all');
  const [page, setPage] = useState(1);

  useEffect(() => { 
    auditService.getLogs(5000).then(setLogs); 
  }, []);

  const filtered = useMemo(() => logs.filter((l) => {
    const q = search.toLowerCase();
    const s = !search || String(l.content_id).toLowerCase().includes(q) || String(l.play_id).toLowerCase().includes(q);
    const c = country === 'all' || l.country === country;
    const u = userType === 'all' || l.user_type === userType;
    const dv = device === 'all' || l.device === device;
    return s && c && u && dv;
  }), [logs, search, country, userType, device]);

  const aggregateRows = useMemo(() => {
    const map: Record<string, any> = {};
    filtered.forEach((r: any) => {
      const key = r.content_id;
      if (!map[key]) map[key] = { content_id: key, plays: 0, count: 0, countries: new Set() };
      map[key].plays += Number(r.plays || 0);
      map[key].count += 1;
      map[key].countries.add(r.country);
    });
    return Object.values(map)
      .map((v) => ({ ...v, countries: Array.from(v.countries).join(', ') }))
      .sort((a, b) => b.plays - a.plays);
  }, [filtered]);

  const tableRows = agg ? aggregateRows : filtered;
  const pageSize = 20;
  const pageRows = tableRows.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.ceil(tableRows.length / pageSize);

  const stats = useMemo(() => {
    const totalPlays = filtered.reduce((s, r) => s + Number(r.plays || 0), 0);
    const uniqueContent = new Set(filtered.map((r) => r.content_id)).size;
    const countries = filtered.reduce((m: Record<string, number>, r: any) => ({ ...m, [r.country]: (m[r.country] || 0) + 1 }), {});
    const mostCountry = Object.entries(countries).sort((a: any, b: any) => b[1] - a[1])[0]?.[0] || '--';
    return { totalPlays, uniqueContent, mostCountry };
  }, [filtered]);

  const handleExport = () => {
    exportToCSV(pageRows, `DLRA_Telemetry_Export_${new Date().toISOString().slice(0, 10)}`);
    toast.success('Telemetry data exported successfully');
  };

  return (
    <div className="page-container">
      <header className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h1 className="page-title">Streaming Telemetry Stream</h1>
            <p className="page-subtitle">Real-time auditing of global playback events across 10 regions.</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--lime-bright)', boxShadow: '0 0 10px var(--lime-bright)' }} />
            <span className="mono" style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>SQLITE_ACTIVE // VER_3.4.0</span>
          </div>
        </div>
        <hr className="page-rule" />
      </header>

      {/* Stats Cluster */}
      <div className="metric-grid">
        <div className="metric-card">
          <div className="metric-label">Total Plays Audited</div>
          <div className="metric-value text-cyan" style={{ fontSize: '32px' }}>{stats.totalPlays.toLocaleString()}</div>
          <div style={{ marginTop: '4px', fontSize: '10px', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Consolidated across edge nodes</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Asset Saturation</div>
          <div className="metric-value text-gold" style={{ fontSize: '32px' }}>{stats.uniqueContent}</div>
          <div style={{ marginTop: '4px', fontSize: '10px', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Active content IDs in buffer</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Dominant Region</div>
          <div className="metric-value text-gold" style={{ fontSize: '32px' }}>{flags[stats.mostCountry] || ''} {stats.mostCountry}</div>
          <div style={{ marginTop: '4px', fontSize: '10px', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Highest traffic density</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Egress Throughput</div>
          <div className="metric-value text-lime" style={{ fontSize: '32px' }}>1.2 GB/s</div>
          <div style={{ marginTop: '4px', fontSize: '10px', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Simulated real-time load</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
          <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
          <input 
            className="control-input" 
            placeholder="Search by Play ID or Asset ID..." 
            value={search} 
            onChange={(e) => { setSearch(e.target.value); setPage(1); }} 
            style={{ paddingLeft: '36px', width: '100%', background: 'var(--bg-raised)' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Globe size={14} color="var(--text-tertiary)" />
            <select className="control-select" value={country} onChange={(e) => { setCountry(e.target.value); setPage(1); }}>
              <option value="all">All Regions</option>
              {Object.keys(flags).map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <User size={14} color="var(--text-tertiary)" />
            <select className="control-select" value={userType} onChange={(e) => { setUserType(e.target.value); setPage(1); }}>
              <option value="all">All Users</option>
              {['premium', 'free', 'trial'].map((u) => <option key={u} value={u}>{u.toUpperCase()}</option>)}
            </select>
          </div>

          <AgenticToggle value={agg} onChange={(v) => { setAgg(v); setPage(1); }} label="AGGREGATED" />

          <button className="btn-secondary" onClick={handleExport} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px' }}>
            <Download size={14} /> EXPORT CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-wrap">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-raised)', borderBottom: '1px solid var(--gold-dim)' }}>
                {agg ? (
                  <>
                    <th style={{ padding: '16px 24px', textAlign: 'left' }} className="metric-label">Asset Identification</th>
                    <th style={{ padding: '16px 24px', textAlign: 'right' }} className="metric-label">Consolidated Plays</th>
                    <th style={{ padding: '16px 24px', textAlign: 'right' }} className="metric-label">Log Density</th>
                    <th style={{ padding: '16px 24px', textAlign: 'left' }} className="metric-label">Geographic Spread</th>
                  </>
                ) : (
                  <>
                    <th style={{ padding: '16px 24px', textAlign: 'left' }} className="metric-label">Event identification</th>
                    <th style={{ padding: '16px 24px', textAlign: 'left' }} className="metric-label">Asset ID</th>
                    <th style={{ padding: '16px 24px', textAlign: 'left' }} className="metric-label">Origin</th>
                    <th style={{ padding: '16px 24px', textAlign: 'right' }} className="metric-label">Plays</th>
                    <th style={{ padding: '16px 24px', textAlign: 'center' }} className="metric-label">Device Type</th>
                    <th style={{ padding: '16px 24px', textAlign: 'right' }} className="metric-label">Telemetry Timestamp</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {pageRows.map((r, i) => (
                <tr 
                  key={agg ? `agg-${r.content_id}-${i}` : r.play_id || i}
                  style={{ 
                    borderBottom: '1px solid var(--border-surface)',
                    background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,215,0,0.03)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)'}
                >
                  {agg ? (
                    <>
                      <td style={{ padding: '16px 24px' }}>
                        <span className="mono" style={{ color: 'var(--gold-bright)', fontSize: '13px' }}>{r.content_id}</span>
                      </td>
                      <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                        <span className="mono glow-gold" style={{ fontWeight: 700 }}>{r.plays.toLocaleString()}</span>
                      </td>
                      <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                        <span className="mono" style={{ color: 'var(--text-tertiary)' }}>{r.count}</span>
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          {r.countries.split(', ').slice(0, 5).map((c: string) => (
                            <span key={c} style={{ fontSize: '12px' }}>{flags[c] || c}</span>
                          ))}
                          {r.countries.split(', ').length > 5 && <span className="mono" style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>+more</span>}
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td style={{ padding: '12px 24px' }}>
                        <span className="mono" style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{r.play_id}</span>
                      </td>
                      <td style={{ padding: '12px 24px' }}>
                        <span className="mono" style={{ fontSize: '12px', color: 'var(--gold-mid)' }}>{r.content_id}</span>
                      </td>
                      <td style={{ padding: '12px 24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span>{flags[r.country]}</span>
                          <span className="mono" style={{ fontSize: '12px' }}>{r.country}</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 24px', textAlign: 'right' }}>
                        <span className="mono" style={{ fontWeight: 600 }}>{Number(r.plays || 0).toLocaleString()}</span>
                      </td>
                      <td style={{ padding: '12px 24px', textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 10px', borderRadius: '4px', background: 'var(--bg-void)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                          {iconByDevice[r.device]}
                          <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{r.device}</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 24px', textAlign: 'right' }}>
                        <span className="mono" style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                          {new Date(r.timestamp).toISOString().replace('T', ' ').slice(0, 19)}
                        </span>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="mono" style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
          SHOWING RECORD {((page - 1) * pageSize) + 1} TO {Math.min(page * pageSize, tableRows.length)} TOTAL {tableRows.length.toLocaleString()}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            className="btn-secondary" 
            disabled={page === 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
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
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

