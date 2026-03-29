import React, { useState, useEffect, useMemo } from 'react';
import { motion, useMotionValue, useSpring, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Download, PlayCircle, Settings, FileText, AlertTriangle, ArrowUpRight, TrendingDown } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import ContractDetailPanel from '../components/ContractDetailPanel';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

// --- HELPER COMPONENT: Animated Number Counter ---
function AnimatedMetric({ value, prefix = '', suffix = '', isRed = false }: { value: number, prefix?: string, suffix?: string, isRed?: boolean }) {
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, { stiffness: 60, damping: 15 });
  const [display, setDisplay] = useState("0");

  useEffect(() => {
    // animate target value
    motionValue.set(value);
  }, [value, motionValue]);

  useEffect(() => {
    return springValue.on("change", (latest) => {
      // formatting specifically tracking dollar values natively
      if (Math.abs(latest) >= 1000) {
        setDisplay(Math.round(latest).toLocaleString());
      } else {
        setDisplay(Number(latest).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }));
      }
    });
  }, [springValue]);

  return (
    <span style={{ 
      color: isRed ? 'var(--danger)' : 'var(--text-primary)', 
      fontFamily: 'var(--font-mono)', 
      fontSize: '32px', 
      fontWeight: 'bold',
      textShadow: isRed ? '0 0 10px rgba(239, 68, 68, 0.4)' : 'none'
    }}>
      {prefix}{display}{suffix}
    </span>
  );
}

// --- MAIN PAGE COMPONENT ---
export default function DashboardPage() {
  const navigate = useNavigate();
  
  // Data States
  const [auditData, setAuditData] = useState<any[]>([]);
  const [violationData, setViolationData] = useState<any[]>([]);
  const [contractsCount, setContractsCount] = useState(0);
  
  // Modal Context State
  const [selectedContentId, setSelectedContentId] = useState<string | null>(null);
  
  // Realtime Active State
  const [isAuditingLive, setIsAuditingLive] = useState(false);
  const [lastAuditId, setLastAuditId] = useState<string>('N/A');

  useEffect(() => {
    const loadInit = async () => {
      // Load total contracts
      const { count } = await supabase.from('contracts').select('*', { count: 'exact', head: true });
      setContractsCount(count || 0);

      // Load all audited results (with contract studio attached if possible, wait, audit_results has contract_id)
      // We need studios. audit_results -> contracts(studio) 
      const { data: audits } = await supabase.from('audit_results').select('*, contracts(studio)');
      if (audits) {
        setAuditData(audits);
        if (audits.length > 0) {
          const sorted = [...audits].sort((a,b) => new Date(b.audited_at).getTime() - new Date(a.audited_at).getTime());
          setLastAuditId(sorted[0].audit_id);
        }
      }

      // Load all violations natively for chart 4
      const { data: viols } = await supabase.from('violations').select('*');
      if (viols) setViolationData(viols);
    };

    loadInit();

    // Setup Supabase Realtime Listener
    const channel = supabase.channel('audit_dashboard')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'audit_results' }, (payload) => {
        setIsAuditingLive(true);
        // append new payload defensively
        setAuditData(prev => [...prev, payload.new]);
        
        // Auto-disable banner after 3 seconds of no insert activity (debounce mechanism simulated by timeout)
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'violations' }, (payload) => {
        setIsAuditingLive(true);
        setViolationData(prev => [...prev, payload.new]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Soft debounce the live tracker banner
  useEffect(() => {
    if (isAuditingLive) {
      const t = setTimeout(() => setIsAuditingLive(false), 2000);
      return () => clearTimeout(t);
    }
  }, [isAuditingLive, auditData.length, violationData.length]);


  // ---- DATA PREPARATION FOR CHARTS & METRICS ----
  const metrics = useMemo(() => {
    let expected = 0;
    let paid = 0;
    let leakageAmount = 0; // Absolute money lost/differed
    
    auditData.forEach(r => {
      expected += r.expected_payment || 0;
      paid += r.actual_payment || 0;
      if (r.difference > 0) leakageAmount += r.difference;
      if (r.violation_type === 'MISSING') leakageAmount += r.expected_payment;
    });

    return { expected, paid, leakage: leakageAmount, playsAudited: auditData.length };
  }, [auditData]);

  // Chart 1: Leakage by Studio
  const studioChartData = useMemo(() => {
    const map = new Map<string, number>();
    auditData.forEach(r => {
      if (r.is_violation && r.difference > 0) { // leakage
        const studio = (r.contracts && r.contracts.studio) ? r.contracts.studio : 'Unknown';
        map.set(studio, (map.get(studio) || 0) + r.difference);
      }
    });
    
    const sorted = Array.from(map.entries()).sort((a,b) => b[1] - a[1]);
    
    return {
      labels: sorted.map(i => i[0]),
      datasets: [{
        label: 'Leakage by Studio',
        data: sorted.map(i => i[1]),
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
        borderColor: 'rgba(239, 68, 68, 1)',
        borderWidth: 1,
        borderRadius: 4,
      }]
    };
  }, [auditData]);

  // Chart 2: Leakage by Content (Top 20)
  const contentChartData = useMemo(() => {
    const map = new Map<string, number>();
    auditData.forEach(r => {
      if (r.is_violation && r.difference > 0) {
        map.set(r.content_id, (map.get(r.content_id) || 0) + r.difference);
      }
    });
    
    const sorted = Array.from(map.entries()).sort((a,b) => b[1] - a[1]).slice(0, 20);
    
    return {
      labels: sorted.map(i => i[0]),
      datasets: [{
        label: 'Leakage by Title',
        data: sorted.map(i => i[1]),
        backgroundColor: 'rgba(245, 166, 35, 0.8)',
        borderColor: 'rgba(245, 166, 35, 1)',
        borderWidth: 1,
        borderRadius: 4,
      }]
    };
  }, [auditData]);

  // Chart 3: Over vs Under Configuration
  const paymentSplitData = useMemo(() => {
    let under = 0;
    let over = 0;
    let missing = 0;
    let clean = 0;

    auditData.forEach(r => {
      if (r.violation_type === 'UNDERPAYMENT') under += r.difference;
      else if (r.violation_type === 'OVERPAYMENT') over += Math.abs(r.difference);
      else if (r.violation_type === 'MISSING') missing += r.expected_payment;
      else clean++; // just counting incidents for clean
    });

    return {
      labels: ['Underpayment', 'Overpayment', 'Missing Data'],
      datasets: [{
        data: [under, over, missing],
        backgroundColor: [
          'rgba(239, 68, 68, 0.8)',
          'rgba(245, 166, 35, 0.8)',
          'rgba(124, 111, 237, 0.8)'
        ],
        borderWidth: 0,
        hoverOffset: 4
      }]
    };
  }, [auditData]);

  // Chart 4: Violations by Type Stacked Log
  const vioTypeData = useMemo(() => {
    const map = new Map<string, number>();
    violationData.forEach(v => {
      map.set(v.violation_type, (map.get(v.violation_type) || 0) + 1);
    });
    
    return {
      labels: Array.from(map.keys()),
      datasets: [{
        label: 'Violation Instances',
        data: Array.from(map.values()),
        backgroundColor: [
          'rgba(239, 68, 68, 0.8)', // EXPIRED
          'rgba(249, 115, 22, 0.8)', // TERRITORY
          'rgba(245, 166, 35, 0.8)', // TIER
          'rgba(153, 27, 27, 0.8)'   // MISSING 
        ]
      }]
    };
  }, [violationData]);

  // Global Chart config defaults for "Dark terminal-grade SaaS"
  const chartOptionsBase = {
    responsive: true,
    maintainAspectRatio: false,
    color: '#8BA0B5',
    plugins: {
      legend: { labels: { color: '#8BA0B5', font: { family: '"JetBrains Mono", monospace' } } },
      tooltip: { backgroundColor: '#19222E', opacity: 0.9, titleFont: { family: '"Syne", sans-serif' }, bodyFont: { family: '"JetBrains Mono", monospace' }, padding: 12, cornerRadius: 8, borderColor: '#1F2D3D', borderWidth: 1 }
    },
    scales: {
      x: { grid: { color: 'rgba(31, 45, 61, 0.5)' }, ticks: { color: '#4A6580', font: { family: '"JetBrains Mono", monospace', size: 10 } } },
      y: { grid: { color: 'rgba(31, 45, 61, 0.5)' }, ticks: { color: '#4A6580', font: { family: '"JetBrains Mono", monospace', size: 11 } } }
    }
  };


  return (
    <div style={{ padding: '0 0 80px 0', minHeight: '100vh', background: 'var(--bg-void)' }}>
      
      {/* REAL-TIME PULSE BANNER */}
      <AnimatePresence>
        {isAuditingLive && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }} 
            animate={{ height: 'auto', opacity: 1 }} 
            exit={{ height: 0, opacity: 0 }}
            style={{ background: 'rgba(0, 217, 192, 0.1)', borderBottom: '1px solid var(--border-glow)', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}
          >
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--border-glow)', boxShadow: '0 0 10px var(--border-glow)', animation: 'pulse 1s infinite' }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--border-glow)', textTransform: 'uppercase', letterSpacing: 1 }}>Auditor Daemon Synchronizing Live Insertions...</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* COMMAND CENTER HEADER */}
      <div style={{ background: 'var(--bg-raised)', borderBottom: '1px solid var(--border-subtle)', padding: '24px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'var(--bg-card)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: '24px', fontWeight: 800, color: 'var(--accent-teal)' }}>DLRA</span>
          </div>
          <div>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '20px', color: 'var(--text-primary)', margin: 0 }}>Digital License Royalty Auditor</h1>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0' }}>Latest Engine Block: {lastAuditId} | Active Subscriptions: {contractsCount}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <button onClick={() => navigate('/audit')} style={{ padding: '12px 24px', background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-heading)', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PlayCircle size={18} /> New Batch Sequence
          </button>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-teal), var(--accent-purple))' }} />
        </div>
      </div>

      <div style={{ display: 'flex', padding: '40px', gap: '32px', maxWidth: '1800px', margin: '0 auto' }}>
        
        {/* MAIN AREA */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* HERO METRICS */}
          <motion.div 
            initial="hidden" animate="show"
            variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } }}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }}
          >
            {[
              { label: 'Active Contracts', val: contractsCount },
              { label: 'Play Actions Parsed', val: metrics.playsAudited },
              { label: 'Expected Total', val: metrics.expected, pre: '$' },
              { label: 'Paid Verified', val: metrics.paid, pre: '$' }
            ].map((m, i) => (
              <motion.div key={i} variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }} style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: '12px' }}>{m.label}</div>
                <AnimatedMetric value={m.val || 0} prefix={m.pre} />
              </motion.div>
            ))}
            
            <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }} style={{ background: 'var(--bg-raised)', padding: '24px', borderRadius: 'var(--radius-md)', border: '1px solid var(--danger)', boxShadow: 'inset 0 0 40px rgba(239, 68, 68, 0.05)' }}>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '12px', color: 'var(--danger)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: '12px' }}>Detected Leakage</div>
              <AnimatedMetric value={metrics.leakage || 0} prefix="$" isRed={true} />
            </motion.div>
          </motion.div>

          {/* 2x2 CHART GRID */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            
            {/* Chart 1 */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '24px', height: '350px' }}>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '16px', color: 'var(--text-primary)', margin: '0 0 16px' }}>Aggregate Leakage by Studio Identity</h3>
              <Bar 
                data={studioChartData} 
                options={{ ...chartOptionsBase, indexAxis: 'y' } as any} 
              />
            </div>

            {/* Chart 2 */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '24px', height: '350px' }}>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '16px', color: 'var(--text-primary)', margin: '0 0 16px' }}>Top 20 Critical Content Exceptions</h3>
              <Bar 
                data={contentChartData} 
                options={{ 
                  ...chartOptionsBase, 
                  scales: { ...chartOptionsBase.scales, x: { ...chartOptionsBase.scales.x, ticks: { ...chartOptionsBase.scales.x.ticks, maxRotation: 45, minRotation: 45 } } },
                  onClick: (event: any, elements: any) => {
                    if (elements.length > 0) {
                      const idx = elements[0].index;
                      const contentId = contentChartData.labels[idx];
                      if (contentId) setSelectedContentId(contentId as string);
                    }
                  }
                } as any} 
              />
            </div>
            
            {/* Chart 3 */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '24px', height: '350px', display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '16px', color: 'var(--text-primary)', margin: '0 0 16px' }}>Ledger Discrepancy Distribution</h3>
              <div style={{ flex: 1, position: 'relative' }}>
                <Doughnut 
                  data={paymentSplitData} 
                  options={{ ...chartOptionsBase, cutout: '75%', plugins: { ...chartOptionsBase.plugins, legend: { position: 'right' } } } as any} 
                />
                <div style={{ position: 'absolute', top: 0, left: 0, right: '30%', bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', pointerEvents: 'none' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '24px', color: 'var(--danger)', fontWeight: 'bold' }}>${Math.round(metrics.leakage).toLocaleString()}</span>
                  <span style={{ fontFamily: 'var(--font-heading)', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Risk Value</span>
                </div>
              </div>
            </div>

            {/* Chart 4 */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '24px', height: '350px' }}>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '16px', color: 'var(--text-primary)', margin: '0 0 16px' }}>Systemic Violations Typology</h3>
              <Bar 
                data={vioTypeData} 
                options={{ ...chartOptionsBase, plugins: { ...chartOptionsBase.plugins, legend: { display: false } } } as any} 
              />
              {/* Minor table under stacked bar */}
              <div style={{ marginTop: '16px', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
                {vioTypeData.labels.map((l, i) => (
                  <div key={l} style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    <span>{l}</span>
                    <span style={{ color: 'var(--text-primary)' }}>{vioTypeData.datasets[0].data[i]} inc</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
          
          {/* LEAKAGE SUMMARY TABLE */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)' }}>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', color: 'var(--text-primary)', margin: 0 }}>Leakage Index Log</h3>
            </div>
            <div style={{ width: '100%', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-raised)', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '11px', letterSpacing: 1 }}>
                    <th style={{ padding: '16px 24px' }}>Rank</th>
                    <th style={{ padding: '16px 24px' }}>Content ID</th>
                    <th style={{ padding: '16px 24px' }}>Studio</th>
                    <th style={{ padding: '16px 24px' }}>Type</th>
                    <th style={{ padding: '16px 24px', textAlign: 'right' }}>Expected</th>
                    <th style={{ padding: '16px 24px', textAlign: 'right' }}>Leakage $</th>
                  </tr>
                </thead>
                <tbody>
                  {auditData.filter(a => a.difference > 0 || a.violation_type === 'MISSING').sort((a,b) => b.difference - a.difference).slice(0, 50).map((a, i) => (
                    <tr key={a.audit_id} style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background 0.2s', cursor: 'pointer' }} onMouseOver={e => e.currentTarget.style.background = 'var(--bg-card-hover)'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '16px 24px', color: 'var(--accent-amber)' }}>#{i+1}</td>
                      <td style={{ padding: '16px 24px', color: 'var(--text-primary)' }}>{a.content_id.slice(0,18)}...</td>
                      <td style={{ padding: '16px 24px', color: 'var(--text-secondary)' }}>{a.contracts?.studio || 'N/A'}</td>
                      <td style={{ padding: '16px 24px', color: a.violation_type === 'MISSING' ? 'var(--danger)' : 'var(--text-secondary)' }}>{a.violation_type || 'UNDERPAYMENT'}</td>
                      <td style={{ padding: '16px 24px', textAlign: 'right', color: 'var(--text-secondary)' }}>${a.expected_payment.toFixed(2)}</td>
                      <td style={{ padding: '16px 24px', textAlign: 'right', color: 'var(--danger)', fontWeight: 'bold' }}>${(a.difference > 0 ? a.difference : a.expected_payment).toFixed(2)}</td>
                    </tr>
                  ))}
                  {auditData.length === 0 && (
                    <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Awaiting full audit data array...</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* QUICK ACTIONS RIGHT SIDEBAR */}
        <div style={{ width: '280px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ background: 'var(--bg-raised)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '24px', position: 'sticky', top: '120px' }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '14px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 16px' }}>Terminal Controls</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button onClick={() => alert('Downloading JSON Export')} style={{ padding: '12px 16px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontFamily: 'var(--font-heading)', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '12px', transition: 'border-color 0.2s' }} onMouseOver={e => e.currentTarget.style.borderColor = 'var(--border-glow)'} onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border-subtle)'}>
                <Download size={16} color="var(--accent-teal)" /> Export JSON Report
              </button>
              
              <button onClick={() => alert('Downloading CSV Results')} style={{ padding: '12px 16px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontFamily: 'var(--font-heading)', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '12px', transition: 'border-color 0.2s' }} onMouseOver={e => e.currentTarget.style.borderColor = 'var(--border-glow)'} onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border-subtle)'}>
                <FileText size={16} color="var(--accent-purple)" /> Export Full CSV
              </button>

              <button onClick={() => navigate('/agent-trace')} style={{ padding: '12px 16px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontFamily: 'var(--font-heading)', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '12px', transition: 'border-color 0.2s' }} onMouseOver={e => e.currentTarget.style.borderColor = 'var(--border-glow)'} onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border-subtle)'}>
                <ArrowUpRight size={16} color="var(--text-secondary)" /> System Agent Traces
              </button>
              
              <button onClick={() => navigate('/violations')} style={{ padding: '12px 16px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontFamily: 'var(--font-heading)', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '12px', transition: 'border-color 0.2s' }} onMouseOver={e => e.currentTarget.style.borderColor = 'var(--danger)'} onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border-subtle)'}>
                <AlertTriangle size={16} color="var(--danger)" /> View Compliance Hub
              </button>
            </div>
            
            <div style={{ marginTop: '32px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
               <h4 style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)', margin: '0 0 12px' }}>STATUS: ONLINE</h4>
               <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>Backend orchestrator connected via WSS stream on channel `audit_dashboard`. Live polling active.</p>
            </div>
          </div>
        </div>
      </div>
      
      <ContractDetailPanel contentId={selectedContentId} onClose={() => setSelectedContentId(null)} />

      <style>{`
        @keyframes pulse {
          0% { opacity: 0.5; transform: scale(0.9); }
          50% { opacity: 1; transform: scale(1.1); }
          100% { opacity: 0.5; transform: scale(0.9); }
        }
      `}</style>
    </div>
  );
}
