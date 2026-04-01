import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingDown, DollarSign, PieChart as PieChartIcon, 
  BarChart, AlertCircle, FileText, ArrowUpRight, 
  ChevronRight, ArrowDownRight, Filter
} from 'lucide-react';
import { 
  BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Cell, PieChart, Pie, AreaChart, Area
} from 'recharts';
import { auditService } from '../services/api';

const COLORS = ['#C6AC76', '#E53935', '#00D9C0', '#4CAF50', '#8E24AA'];

export default function LeakageSummary() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    auditService.getAuditResults().then((res) => {
      setData(res || []);
      setLoading(false);
    });
  }, []);

  const stats = useMemo(() => {
    const total = data.reduce((acc, r) => acc + (r.variance || 0), 0);
    const violations = data.filter(r => (r.variance || 0) > 0).length;
    const resolved = data.filter(r => r.reconciled).length;
    return {
      total,
      violations,
      unresolved: violations - resolved,
      leakageRate: (total / 1500000) * 100 // Hardcoded revenue for demo
    };
  }, [data]);

  const platformData = [
    { name: 'Spotify', value: 45200, color: '#C6AC76' },
    { name: 'Apple', value: 31800, color: '#A0A0A0' },
    { name: 'Google', value: 12400, color: '#00D9C0' },
    { name: 'Amazon', value: 8900, color: '#8E24AA' },
  ];

  const trendData = [
    { month: 'Oct', leakage: 12000 },
    { month: 'Nov', leakage: 15400 },
    { month: 'Dec', leakage: 9800 },
    { month: 'Jan', leakage: 22100 },
    { month: 'Feb', leakage: 18500 },
    { month: 'Mar', leakage: stats.total / 10 || 5000 },
  ];

  if (loading) return <div className="page-container"><div className="mono">ANALYZING_FINANCIAL_DIMENSIONS...</div></div>;

  return (
    <div className="page-container">
      <header className="page-header">
        <h1 className="page-title">Executive Leakage Analysis</h1>
        <p className="page-subtitle">Multi-dimensional breakdown of royalty disparities and financial impact.</p>
        <hr className="page-rule" />
      </header>

      {/* Hero Metrics */}
      <div className="metric-grid" style={{ marginBottom: '32px' }}>
        <div className="metric-card">
          <div className="metric-label">CUMULATIVE LEAKAGE</div>
          <div className="metric-value text-crimson" style={{ fontSize: '32px' }}>
            ${stats.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '8px', color: 'var(--crimson-bright)', fontSize: '11px' }}>
            <TrendingDown size={12} /> <span>+12.4% vs PREVIOUS_QUARTER</span>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-label">LEAKAGE RATE</div>
          <div className="metric-value text-gold" style={{ fontSize: '32px' }}>
            {stats.leakageRate.toFixed(2)}%
          </div>
          <div className="mono" style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginTop: '8px' }}>OF_TOTAL_GROSS_SETTLEMENT</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">RECOVERABLE AMOUNT</div>
          <div className="metric-value text-cyan" style={{ fontSize: '32px' }}>
            ${(stats.total * 0.85).toLocaleString(undefined, { minimumFractionDigits: 0 })}
          </div>
          <div className="mono" style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginTop: '8px' }}>85%_CONFIDENCE_RECOVERY_ESTIMATE</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">UNRESOLVED BREACHES</div>
          <div className="metric-value text-gold" style={{ fontSize: '32px' }}>
            {stats.unresolved}
          </div>
          <div className="mono" style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginTop: '8px' }}>PNDG_LITIGATION_OR_RECONCILIATION</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '24px', marginBottom: '32px' }}>
        
        {/* Trend Chart */}
        <div className="panel" style={{ gridColumn: 'span 8', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
             <h3 className="mono" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>LEAKAGE_TEMPORAL_TREND</h3>
             <div style={{ display: 'flex', gap: '8px' }}>
               <button className="pill active">6-MONTH</button>
               <button className="pill">12-MONTH</button>
             </div>
          </div>
          <div style={{ height: '300px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorLeakage" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--crimson-dim)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--crimson-dim)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                <XAxis dataKey="month" stroke="var(--text-tertiary)" fontSize={11} axisLine={false} tickLine={false} />
                <YAxis stroke="var(--text-tertiary)" fontSize={11} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v/1000}k`} />
                <Tooltip 
                  contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-surface)', borderRadius: '4px' }}
                  itemStyle={{ color: 'var(--crimson-bright)', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="leakage" stroke="var(--crimson-bright)" strokeWidth={2} fillOpacity={1} fill="url(#colorLeakage)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Platform Breakdown */}
        <div className="panel" style={{ gridColumn: 'span 4', padding: '24px' }}>
          <h3 className="mono" style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '24px' }}>PLATFORM_DISTRIBUTION</h3>
          <div style={{ height: '240px', position: 'relative' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={platformData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {platformData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
              <div className="mono" style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>MAJORITY</div>
              <div className="mono" style={{ fontSize: '14px', color: 'var(--gold-bright)' }}>Spotify</div>
            </div>
          </div>
          <div style={{ marginTop: '16px' }}>
            {platformData.map((p) => (
              <div key={p.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '8px', height: '8px', background: p.color, borderRadius: '2px' }} />
                  <span className="mono" style={{ fontSize: '11px' }}>{p.name}</span>
                </div>
                <span className="mono" style={{ fontSize: '11px' }}>${p.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
        
        {/* Risk Categories */}
        <div className="panel" style={{ padding: '24px' }}>
           <h3 className="mono" style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '20px' }}>RISK_CATEGORY_EXPOSURE</h3>
           {[
             { label: 'Contract Tiers (Rate Violations)', risk: 'Critical', value: 68, color: 'var(--crimson-bright)' },
             { label: 'Territory Infringement', risk: 'High', value: 42, color: 'var(--gold-bright)' },
             { label: 'Payment Reconciliation Errors', risk: 'Medium', value: 15, color: 'var(--cyan-bright)' },
             { label: 'Missing Settlement Logs', risk: 'Medium', value: 12, color: 'var(--lime-bright)' },
           ].map((item) => (
             <div key={item.label} style={{ marginBottom: '16px' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                 <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{item.label}</span>
                 <span className="mono" style={{ fontSize: '10px', color: item.color }}>{item.risk.toUpperCase()}</span>
               </div>
               <div style={{ height: '4px', background: 'var(--bg-base)', borderRadius: '2px', overflow: 'hidden' }}>
                 <motion.div 
                   initial={{ width: 0 }}
                   animate={{ width: `${item.value}%` }}
                   style={{ height: '100%', background: item.color }}
                 />
               </div>
             </div>
           ))}
        </div>

        {/* Critical Alerts */}
        <div className="panel" style={{ padding: '24px' }}>
           <h3 className="mono" style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '20px' }}>INTELLIGENCE_ALERTS</h3>
           <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
             <div style={{ padding: '12px', background: 'rgba(229, 57, 53, 0.05)', border: '1px solid var(--crimson-dim)', borderRadius: '4px', display: 'flex', gap: '12px' }}>
               <AlertCircle size={16} className="text-crimson" style={{ flexShrink: 0 }} />
               <div>
                  <div className="mono" style={{ fontSize: '11px', fontWeight: 600, color: 'var(--crimson-bright)' }}>SEVERE_DISPARITY_DETECTED</div>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '4px 0 0' }}>Spotify (Europe) showing 12% underpayment on Tier-2 indie contracts since Jan 2024.</p>
               </div>
             </div>
             <div style={{ padding: '12px', background: 'rgba(198, 172, 118, 0.05)', border: '1px solid var(--gold-dim)', borderRadius: '4px', display: 'flex', gap: '12px' }}>
               <FileText size={16} className="text-gold" style={{ flexShrink: 0 }} />
               <div>
                  <div className="mono" style={{ fontSize: '11px', fontWeight: 600, color: 'var(--gold-bright)' }}>EXPIRING_LICENSE_WARNING</div>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '4px 0 0' }}>42 Sony ATV contracts expiring within 30 days. High risk of playback without coverage.</p>
               </div>
             </div>
           </div>
           <button className="btn-secondary" style={{ width: '100%', marginTop: '20px', fontSize: '11px' }}>
             VIEW ALL AUDIT INSIGHTS <ChevronRight size={12} />
           </button>
        </div>

      </div>
    </div>
  );
}
