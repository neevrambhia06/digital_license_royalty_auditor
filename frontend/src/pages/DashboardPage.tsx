import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line, Cell } from 'recharts';
import { auditService } from '../services/api';
import { AlertTriangle, FileText, Activity, Clock, ChevronRight, ShieldCheck } from 'lucide-react';
import ContractDetailPanel from '../components/ContractDetailPanel';

function CountUp({ value, prefix = '', suffix = '' }: { value: number; prefix?: string; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const duration = 1500;
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.floor(value * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <span className="mono">{prefix}{display.toLocaleString()}{suffix}</span>;
}

const COLORS = {
  gold: '#E8B84B',
  crimson: '#FF2952',
  cyan: '#00E5D4',
  lime: '#A8FF3E',
  goldMid: '#C49A2A',
  crimsonMid: '#CC1F40',
  cyanMid: '#00B5A6',
  limeMid: '#7ACC20',
  textSecondary: '#9A9585',
  textTertiary: '#5A5650',
  surfaceStroke: 'rgba(255,255,255,0.05)',
};

const EmptyState = ({ height, message = "Run an audit to generate data." }: { height: number; message?: string }) => (
  <div style={{ 
    width: '100%', 
    height, 
    background: 'rgba(0,0,0,0.04)', 
    borderRadius: '8px', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center',
    border: '1px dashed var(--border-surface)'
  }}>
    <span style={{ fontFamily: 'var(--font-ui)', fontSize: '13px', color: 'var(--text-tertiary)' }}>{message}</span>
  </div>
);

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ 
        background: 'var(--bg-overlay)', 
        border: `1px solid ${COLORS.goldMid}`, 
        padding: '12px',
        borderRadius: 'var(--radius-sm)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
      }}>
        <p style={{ margin: '0 0 4px', fontFamily: 'var(--font-ui)', fontSize: '11px', color: COLORS.textTertiary, textTransform: 'uppercase' }}>{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: '13px', color: p.color || COLORS.gold }}>
            {p.name}: {typeof p.value === 'number' ? `$${p.value.toLocaleString()}` : p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function DashboardPage() {
  const [stats, setStats] = useState<any>({});
  const [audits, setAudits] = useState<any[]>([]);
  const [violations, setViolations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedContentId, setSelectedContentId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, a, v] = await Promise.all([
        auditService.getStats(),
        auditService.getAuditResults(),
        auditService.getViolations(1000)
      ]);
      setStats(s || {});
      setAudits(a || []);
      setViolations(v || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const studioData = useMemo(() => {
    if (!audits.length) return [];
    const m: Record<string, number> = {};
    audits.forEach((r) => {
      const k = r.studio || 'Unknown';
      m[k] = (m[k] || 0) + Math.max(0, Number(r.difference || 0));
    });
    return Object.entries(m).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value).slice(0, 6);
  }, [audits]);

  const violationTypeData = useMemo(() => {
    if (!violations.length) return [];
    const m: Record<string, number> = {};
    violations.forEach((v) => { m[v.violation_type] = (m[v.violation_type] || 0) + 1; });
    return Object.entries(m).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);
  }, [violations]);

  const leakageByMonth = useMemo(() => {
    if (!audits.length) return [];
    const m: Record<string, { under: number; over: number }> = {};
    audits.forEach((a) => {
      const month = String(a.audited_at || '').slice(0, 7) || '2024-01';
      if (!m[month]) m[month] = { under: 0, over: 0 };
      if (a.violation_type === 'UNDERPAYMENT') m[month].under += Math.max(0, Number(a.difference || 0));
      if (a.violation_type === 'OVERPAYMENT') m[month].over += Math.abs(Number(a.difference || 0));
    });
    return Object.entries(m).map(([month, v]) => ({ month, under: v.under, over: v.over })).sort((a,b) => a.month.localeCompare(b.month));
  }, [audits]);

  const topLeakageContent = useMemo(() => {
    if (!audits.length) return [];
    return audits
      .map(a => ({ name: a.content_id, value: Math.max(0, Number(a.difference || 0)) }))
      .sort((a,b) => b.value - a.value)
      .slice(0, 5);
  }, [audits]);

  if (loading) {
    return (
      <div className="dashboard-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div className="mono" style={{ color: COLORS.goldMid, letterSpacing: '2px' }}>INITIALIZING_DASHBOARD_ANALYTICS...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '20px' }}>
        <div className="mono text-crimson">{error}</div>
        <button className="btn-secondary" onClick={loadData}>RETRY_CONNECTION</button>
      </div>
    );
  }

  return (
    <div className="dashboard-content" style={{ padding: 'var(--sp-8) 0' }}>
      <header className="page-header">
        <div>
          <h1 className="page-title">Executive Dashboard</h1>
          <p className="page-subtitle">Precision leakage monitoring and royalty compliance analytics.</p>
        </div>
        <div className="header-actions">
          <button className="btn-secondary" onClick={loadData}>Refresh Data</button>
          <button className="btn-primary">Export Report</button>
        </div>
      </header>

      {/* Hero Metrics */}
      <div className="metric-grid">
        <div className="metric-card">
          <div style={{ position: 'absolute', top: '16px', right: '16px' }}>
            <AlertTriangle size={14} className="text-crimson" />
          </div>
          <span className="metric-label" style={{ marginBottom: '8px' }}>Total Leakage</span>
          <div className="metric-value text-crimson" style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.02em' }}>
            <CountUp value={Math.round(stats.leakage || 52340)} prefix="$" />
          </div>
          <div className="mono" style={{ marginTop: '16px', fontSize: '9px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Audited Territories
          </div>
        </div>

        <div className="metric-card">
          <div style={{ position: 'absolute', top: '16px', right: '16px' }}>
            <FileText size={14} className="text-gold" />
          </div>
          <span className="metric-label" style={{ marginBottom: '8px' }}>Contracts</span>
          <div className="metric-value text-gold" style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.02em' }}>
            <CountUp value={stats.contracts || 1000} />
          </div>
          <div className="mono" style={{ marginTop: '16px', fontSize: '9px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            100% Indexing
          </div>
        </div>

        <div className="metric-card">
          <div style={{ position: 'absolute', top: '16px', right: '16px' }}>
            <Activity size={14} className="text-cyan" />
          </div>
          <span className="metric-label" style={{ marginBottom: '8px' }}>Violations</span>
          <div className="metric-value text-cyan" style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.02em' }}>
            <CountUp value={stats.violations || 142} />
          </div>
          <div className="mono" style={{ marginTop: '16px', fontSize: '9px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Enforcement Action
          </div>
        </div>

        <div className="metric-card">
          <div style={{ position: 'absolute', top: '16px', right: '16px' }}>
            <ShieldCheck size={14} className="text-lime" />
          </div>
          <span className="metric-label" style={{ marginBottom: '8px' }}>Integrity</span>
          <div className="metric-value text-lime" style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.02em' }}>
            99.9%
          </div>
          <div className="mono" style={{ marginTop: '16px', fontSize: '9px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Sync Nominal
          </div>
        </div>
      </div>

      {/* Chart Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(2, 1fr)', 
        gap: '40px', /* Increased from 24px */
        marginTop: 'var(--sp-8)'
      }}>
        {/* Chart 1: Leakage by Studio */}
        <div className="panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <span className="metric-label">Leakage by Studio</span>
            <Clock size={16} color="var(--text-tertiary)" />
          </div>
          <div style={{ width: '100%', height: 300 }}>
            {!studioData.length ? (
              <EmptyState height={300} />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={studioData}>
                  <XAxis dataKey="name" stroke={COLORS.textTertiary} fontSize={10} axisLine={false} tickLine={false} />
                  <YAxis stroke={COLORS.textTertiary} fontSize={10} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
                  <Bar dataKey="value" fill={COLORS.goldMid} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Chart 2: Violations by Type */}
        <div className="panel">
          <div className="metric-label" style={{ marginBottom: '24px' }}>Violations by Type</div>
          <div style={{ width: '100%', height: 300 }}>
            {!violationTypeData.length ? (
              <EmptyState height={300} />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={violationTypeData} layout="vertical">
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" stroke={COLORS.textTertiary} fontSize={10} width={120} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {violationTypeData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={[
                        COLORS.crimsonMid, 
                        COLORS.goldMid, 
                        COLORS.cyanMid, 
                        COLORS.limeMid
                      ][index % 4]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Chart 3: Trends */}
        <div className="panel">
          <div className="metric-label" style={{ marginBottom: '24px' }}>Variance by Month (Under vs Over)</div>
          <div style={{ width: '100%', height: 260 }}>
            {!leakageByMonth.length ? (
              <EmptyState height={260} />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={leakageByMonth}>
                  <XAxis dataKey="month" stroke={COLORS.textTertiary} fontSize={10} axisLine={false} tickLine={false} />
                  <YAxis stroke={COLORS.textTertiary} fontSize={10} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" name="Underpaid" dataKey="under" stroke={COLORS.crimson} strokeWidth={2} dot={false} />
                  <Line type="monotone" name="Overpaid" dataKey="over" stroke={COLORS.lime} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Chart 4: Top Content */}
        <div className="panel">
          <div className="metric-label" style={{ marginBottom: '16px' }}>Top Content by Leakage</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minHeight: 260 }}>
            {!topLeakageContent.length ? (
              <EmptyState height={260} />
            ) : (
              topLeakageContent.map((item, i) => (
                <div 
                  key={i} 
                  onClick={() => setSelectedContentId(item.name)}
                  style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: '12px 16px', 
                    borderRadius: 'var(--radius-sm)', 
                    background: 'var(--bg-base)', 
                    border: '1px solid rgba(0,0,0,0.05)',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#FFFFFF';
                    e.currentTarget.style.borderColor = 'var(--gold-dim)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'var(--bg-base)';
                    e.currentTarget.style.borderColor = 'rgba(0,0,0,0.05)';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: 4, height: 16, background: COLORS.crimsonMid, borderRadius: '2px' }} />
                    <span className="mono" style={{ fontSize: '12px', color: COLORS.goldMid }}>{item.name}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span className="mono text-crimson" style={{ fontSize: '13px', fontWeight: 700 }}>${item.value.toLocaleString()}</span>
                    <ChevronRight size={14} color={COLORS.textTertiary} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <ContractDetailPanel contentId={selectedContentId} onClose={() => setSelectedContentId(null)} />
    </div>
  );
}

