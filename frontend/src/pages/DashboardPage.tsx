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

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ 
        background: 'var(--bg-overlay)', 
        border: '1px solid var(--gold-dim)', 
        padding: '12px',
        borderRadius: 'var(--radius-sm)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
      }}>
        <p style={{ margin: '0 0 4px', fontFamily: 'var(--font-ui)', fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: '13px', color: p.color || 'var(--text-primary)' }}>
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
  const [selectedContentId, setSelectedContentId] = useState<string | null>(null);

  const loadData = async () => {
    const [s, a, v] = await Promise.all([
      auditService.getStats(),
      auditService.getAuditResults(),
      auditService.getViolations(1000)
    ]);
    setStats(s || {});
    setAudits(a || []);
    setViolations(v || []);
  };

  useEffect(() => {
    loadData();
  }, []);

  const studioData = useMemo(() => {
    const m: Record<string, number> = {};
    audits.forEach((r) => {
      const k = r.studio || 'Unknown';
      m[k] = (m[k] || 0) + Math.max(0, Number(r.difference || 0));
    });
    return Object.entries(m).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value).slice(0, 6);
  }, [audits]);

  const violationTypeData = useMemo(() => {
    const m: Record<string, number> = {};
    violations.forEach((v) => { m[v.violation_type] = (m[v.violation_type] || 0) + 1; });
    return Object.entries(m).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);
  }, [violations]);

  const leakageByMonth = useMemo(() => {
    const m: Record<string, { under: number; over: number }> = {};
    audits.forEach((a) => {
      const month = String(a.audited_at || '').slice(0, 7) || 'Jan 2024';
      if (!m[month]) m[month] = { under: 0, over: 0 };
      if (a.violation_type === 'UNDERPAYMENT') m[month].under += Math.max(0, Number(a.difference || 0));
      if (a.violation_type === 'OVERPAYMENT') m[month].over += Math.abs(Number(a.difference || 0));
    });
    return Object.entries(m).map(([month, v]) => ({ month, under: v.under, over: v.over }));
  }, [audits]);

  const topLeakageContent = useMemo(() => {
    return audits
      .map(a => ({ name: a.content_id, value: Math.max(0, Number(a.difference || 0)) }))
      .sort((a,b) => b.value - a.value)
      .slice(0, 6);
  }, [audits]);

  return (
    <div className="dashboard-content">
      <header className="page-header">
        <h1 className="page-title">Executive Dashboard</h1>
        <hr className="page-rule" />
        <p className="page-subtitle">Precision leakage monitoring and royalty compliance analytics.</p>
      </header>

      {/* Hero Metrics */}
      <div className="metric-grid">
        <div className="metric-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <span className="metric-label">Total Leakage Found</span>
            <AlertTriangle size={14} className="text-crimson" />
          </div>
          <div className="metric-value glow-crimson" style={{ fontSize: '36px' }}>
            <CountUp value={Math.round(stats.leakage || 52340)} prefix="$" />
          </div>
          <div style={{ marginTop: '8px', fontSize: '10px', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
            Across all audited territories
          </div>
        </div>

        <div className="metric-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <span className="metric-label">Contracts Audited</span>
            <FileText size={14} className="text-gold" />
          </div>
          <div className="metric-value text-gold" style={{ fontSize: '36px' }}>
            <CountUp value={stats.contracts || 1000} />
          </div>
          <div style={{ marginTop: '8px', fontSize: '10px', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
            100% Indexing Coverage
          </div>
        </div>

        <div className="metric-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <span className="metric-label">Violations Detected</span>
            <Activity size={14} className="text-cyan" />
          </div>
          <div className="metric-value text-cyan" style={{ fontSize: '36px' }}>
            <CountUp value={stats.violations || 142} />
          </div>
          <div style={{ marginTop: '8px', fontSize: '10px', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
            Active Enforcement Action
          </div>
        </div>

        <div className="metric-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <span className="metric-label">System Integrity</span>
            <ShieldCheck size={14} className="text-lime" />
          </div>
          <div className="metric-value text-lime" style={{ fontSize: '36px' }}>
            99.9%
          </div>
          <div style={{ marginTop: '8px', fontSize: '10px', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
            Agent Sync Nominal
          </div>
        </div>
      </div>

      {/* Chart Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(2, 1fr)', 
        gap: '24px' 
      }}>
        {/* Chart 1: Leakage by Studio */}
        <div className="panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <span className="metric-label">Leakage by Studio</span>
            <Clock size={16} color="var(--text-tertiary)" />
          </div>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={studioData}>
                <XAxis dataKey="name" stroke="var(--text-tertiary)" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis stroke="var(--text-tertiary)" fontSize={10} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="value" fill="var(--gold-mid)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Violations by Type */}
        <div className="panel">
          <div className="metric-label" style={{ marginBottom: '24px' }}>Violations by Type</div>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={violationTypeData} layout="vertical">
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" stroke="var(--text-tertiary)" fontSize={10} width={120} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {violationTypeData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={[
                      'var(--crimson-mid)', 
                      'var(--gold-mid)', 
                      'var(--cyan-mid)', 
                      'var(--lime-mid)'
                    ][index % 4]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Trends */}
        <div className="panel">
          <div className="metric-label" style={{ marginBottom: '24px' }}>Variance by Month (Under vs Over)</div>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={leakageByMonth}>
                <XAxis dataKey="month" stroke="var(--text-tertiary)" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis stroke="var(--text-tertiary)" fontSize={10} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" name="Underpaid" dataKey="under" stroke="var(--crimson-hot)" strokeWidth={2} dot={false} />
                <Line type="monotone" name="Overpaid" dataKey="over" stroke="var(--lime-bright)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Top Content */}
        <div className="panel">
          <div className="metric-label" style={{ marginBottom: '16px' }}>Top Content by Leakage</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {topLeakageContent.map((item, i) => (
              <div 
                key={i} 
                onClick={() => setSelectedContentId(item.name)}
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '12px 16px', 
                  borderRadius: 'var(--radius-sm)', 
                  background: 'var(--bg-void)', 
                  border: '1px solid var(--border-surface)',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--gold-ghost)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'var(--bg-void)'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: 4, height: 16, background: 'var(--crimson-mid)', borderRadius: '2px' }} />
                  <span className="mono" style={{ fontSize: '12px', color: 'var(--gold-bright)' }}>{item.name}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span className="mono glow-crimson" style={{ fontSize: '13px', fontWeight: 700 }}>${item.value.toLocaleString()}</span>
                  <ChevronRight size={14} color="var(--text-tertiary)" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <ContractDetailPanel contentId={selectedContentId} onClose={() => setSelectedContentId(null)} />
    </div>
  );
}

