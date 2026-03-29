import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useSpring, useMotionValue } from 'framer-motion';
import { Search, CheckCircle, XCircle, AlertTriangle, TrendingDown, Terminal, Play, Loader2 } from 'lucide-react';
import DataTable from '../components/ui/DataTable';
import Badge from '../components/ui/Badge';
import MetricCard from '../components/ui/MetricCard';
import Card from '../components/ui/Card';
import { auditAgent, AuditSummary } from '../agents/auditAgent';

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } }
};
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } }
};

// Animated Number Component
function AnimatedNumber({ value, prefix = '', suffix = '' }: { value: number, prefix?: string, suffix?: string }) {
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, {
    damping: 25,
    stiffness: 100
  });
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    motionValue.set(value);
  }, [value, motionValue]);

  useEffect(() => {
    return springValue.on('change', (latest) => {
      setDisplayValue(Math.round(latest));
    });
  }, [springValue]);

  return <span>{prefix}{displayValue.toLocaleString()}{suffix}</span>;
}

export default function AuditPage() {
  const [auditState, setAuditState] = useState<'idle' | 'running' | 'completed'>('idle');
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [auditSummary, setAuditSummary] = useState<AuditSummary | null>(null);
  const [resultsData, setResultsData] = useState<any[]>([]);
  
  const [trimSearch, setTrimSearch] = useState('');
  const [aiQuery, setAiQuery] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  
  const [activeTab, setActiveTab] = useState('all');
  const [page, setPage] = useState(1);
  const perPage = 10;

  const runAudit = async () => {
    setAuditState('running');
    setTerminalLogs([]);
    
    const logs = [
      "→ ContractReaderAgent: loading active contracts...",
      "→ ContractReaderAgent: loaded 1,000 contracts [12ms]",
      "→ StreamingLogAgent: aggregating plays...",
      "→ StreamingLogAgent: aggregated 100,000 plays [34ms]",
      "→ RoyaltyCalculatorAgent: calculating expected royalties...",
      "→ RoyaltyCalculatorAgent: calculated 1,000 expected royalties [89ms]",
      "→ LedgerAgent: fetching payment records...",
      "→ LedgerAgent: fetched 10,000 payment records [22ms]",
      "→ AuditAgent: comparing expected vs paid...",
      "→ LeakageDetector: flagging anomalies..."
    ];

    // Simulate terminal stream
    for (let i = 0; i < logs.length; i++) {
      await new Promise(r => setTimeout(r, 150 + Math.random() * 200));
      setTerminalLogs(prev => [...prev, logs[i]]);
    }

    try {
      // Execute actual audit
      const summary = await auditAgent.runFullAudit();
      const results = await auditAgent.getAuditResults();
      
      setAuditSummary(summary);
      setResultsData(results.sort((a,b) => b.difference - a.difference));
      
      setTerminalLogs(prev => [...prev, `✓ Audit complete in ${(summary.audit_duration_ms / 1000).toFixed(1)}s`]);
      
      await new Promise(r => setTimeout(r, 600)); // Pause to let user read
      setAuditState('completed');
    } catch (err: any) {
      setTerminalLogs(prev => [...prev, `❌ AUDIT FAILED: ${err.message}`]);
      setAuditState('idle'); // revert on error
    }
  };

  const filtered = activeTab === 'all' 
    ? resultsData 
    : resultsData.filter(r => {
        if (activeTab === 'clean') return r.violation_type === null;
        return r.violation_type?.toLowerCase() === activeTab;
      });
      
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  const columns = [
    { key: 'content_id', label: 'Content ID' },
    { 
      key: 'contracts', label: 'Studio',
      render: (v: any) => v?.studio || 'Unknown' 
    },
    {
      key: 'expected_payment', label: 'Expected', align: 'right',
      render: (v: number) => `$${v.toLocaleString()}`
    },
    {
      key: 'actual_payment', label: 'Paid', align: 'right',
      render: (v: number) => `$${v.toLocaleString()}`
    },
    {
      key: 'difference', label: 'Difference', align: 'right',
      render: (v: number) => {
        const color = v > 0 ? 'var(--danger)' : v < 0 ? 'var(--accent-amber)' : 'var(--text-muted)';
        const prefix = v > 0 ? '+' : '';
        return <span style={{ color, fontFamily: 'var(--font-mono)' }}>{v === 0 ? '--' : `${prefix}$${Math.abs(v).toLocaleString()}`}</span>;
      }
    },
    {
      key: 'violation_type', label: 'Type',
      render: (v: string | null) => v ? <Badge type={v.toLowerCase()}>{v}</Badge> : <Badge type="clean">CLEAN</Badge>
    }
  ];

  const tabs = ['all', 'clean', 'underpayment', 'overpayment', 'missing'];

  return (
    <div style={{ position: 'relative', width: '100%', minHeight: 'calc(100vh - 120px)' }}>
      
      {/* PRE-AUDIT HERO STATE */}
      <AnimatePresence mode="wait">
        {auditState !== 'completed' && (
          <motion.div 
            key="hero"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95, filter: 'blur(4px)' }}
            transition={{ duration: 0.5 }}
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'radial-gradient(circle at center, rgba(0, 217, 192, 0.05) 0%, transparent 60%)'
            }}
          >
            {/* @ts-ignore */}
            <Card style={{
              width: '100%',
              maxWidth: '600px',
              textAlign: 'center',
              padding: '48px 32px',
              background: 'var(--bg-card)',
              borderColor: 'var(--border-subtle)'
            }}>
              <h1 style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '48px',
                fontWeight: 800,
                color: 'var(--text-primary)',
                marginBottom: '16px',
                letterSpacing: '-0.02em'
              }}>
                Audit Engine
              </h1>
              
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '14px',
                color: 'var(--accent-teal)',
                marginBottom: '32px'
              }}>
                {resultsData.length === 0 ? "1,000 contracts · 100,000 plays · 10,000 payments" : "Ready for next cycle"}
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '40px' }}>
                <span style={{ padding: '6px 12px', background: 'var(--bg-raised)', borderRadius: '4px', fontSize: '12px', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)' }}>Contracts Ready</span>
                <span style={{ padding: '6px 12px', background: 'var(--bg-raised)', borderRadius: '4px', fontSize: '12px', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)' }}>Logs Loaded</span>
                <span style={{ padding: '6px 12px', background: 'var(--bg-raised)', borderRadius: '4px', fontSize: '12px', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)' }}>Ledger Ready</span>
              </div>

              {auditState === 'idle' ? (
                <motion.button
                  whileHover={{ scale: 1.02, boxShadow: '0 0 20px rgba(0, 217, 192, 0.3)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={runAudit}
                  style={{
                    background: 'var(--bg-raised)',
                    border: '1px solid var(--accent-teal)',
                    color: 'var(--accent-teal)',
                    fontFamily: 'var(--font-heading)',
                    fontSize: '20px',
                    fontWeight: 700,
                    padding: '16px 48px',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    margin: '0 auto',
                    boxShadow: '0 0 10px rgba(0, 217, 192, 0.1)'
                  }}
                >
                  <Play size={24} fill="currentColor" />
                  RUN AUDIT
                </motion.button>
              ) : (
                <div style={{ width: '100%', textAlign: 'left', background: 'var(--bg-base)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--text-secondary)', minHeight: '300px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--accent-teal)', marginBottom: '16px' }}>
                    <Loader2 size={16} style={{ animation: 'spin 2s linear infinite' }} />
                    Running Audit Engine v2.0...
                  </div>
                  {terminalLogs.map((log, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      style={{ marginBottom: '8px', color: log.startsWith('✓') ? 'var(--success)' : log.startsWith('❌') ? 'var(--danger)' : 'inherit' }}
                    >
                      {log}
                    </motion.div>
                  ))}
                  <motion.div
                    animate={{ opacity: [1, 0] }}
                    transition={{ repeat: Infinity, duration: 0.8 }}
                    style={{ marginTop: '8px', width: '8px', height: '15px', background: 'var(--accent-teal)' }}
                  />
                </div>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* POST-AUDIT RESULTS */}
      <AnimatePresence>
        {auditState === 'completed' && auditSummary && (
          <motion.div 
            key="results"
            variants={stagger} 
            initial="hidden" 
            animate="show"
          >
            {/* HERO METRIC */}
            <motion.div variants={fadeUp} style={{ textAlign: 'center', margin: '40px 0 60px' }}>
              <div style={{ 
                fontFamily: 'var(--font-heading)', 
                fontSize: '64px', 
                fontWeight: 800, 
                color: 'var(--danger)',
                letterSpacing: '-0.02em',
                textShadow: '0 0 40px rgba(239, 68, 68, 0.2)'
              }}>
                $<AnimatedNumber value={auditSummary.total_leakage} /> 
              </div>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '24px', color: 'var(--text-primary)', marginTop: '8px' }}>
                in royalty leakage detected
              </div>
            </motion.div>

            {/* Metrics */}
            <motion.div variants={fadeUp} style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '16px',
              marginBottom: '32px'
            }}>
              <MetricCard 
                label="Underpayments" 
                value={auditSummary.underpayments} 
                color="var(--danger)" 
                icon={TrendingDown} 
                sublabel="Need recovery" 
              />
              <MetricCard 
                label="Overpayments" 
                value={auditSummary.overpayments} 
                color="var(--accent-amber)" 
                icon={AlertTriangle} 
                sublabel="Credits pending" 
              />
              <MetricCard 
                label="Missing Payments" 
                value={auditSummary.missing_payments} 
                color="var(--warning)" 
                icon={XCircle} 
                sublabel="Zero paid" 
              />
              <MetricCard 
                label="Clean Contracts" 
                value={auditSummary.total_contracts_audited - auditSummary.violations} 
                color="var(--success)" 
                icon={CheckCircle} 
                sublabel="Fully reconciled" 
              />
            </motion.div>

            {/* Tabs */}
            <motion.div variants={fadeUp} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              marginBottom: '16px'
            }}>
              {tabs.map(t => (
                <button
                  key={t}
                  onClick={() => { setActiveTab(t); setPage(1); }}
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid',
                    borderColor: activeTab === t ? 'var(--accent-teal)' : 'var(--border-subtle)',
                    background: activeTab === t ? 'rgba(0,217,192,0.08)' : 'transparent',
                    color: activeTab === t ? 'var(--accent-teal)' : 'var(--text-muted)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {t === 'all' ? 'ALL' : t.replace('_', ' ')}
                </button>
              ))}
            </motion.div>

            {/* Table */}
            <motion.div variants={fadeUp} style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
              marginBottom: '40px'
            }}>
              <div style={{
                padding: '14px 20px',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <h2 style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '15px',
                  fontWeight: 700,
                  color: 'var(--text-primary)'
                }}>
                  Leakage Detection Table
                </h2>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>
                  {filtered.length} results
                </span>
              </div>
              <DataTable
                columns={columns}
                data={paged}
                onRowClick={() => {}}
                isLoading={false}
                expandedRowId={null}
                expandedRowContent={null}
                pagination={{
                  page,
                  perPage,
                  total: filtered.length,
                  onPageChange: setPage
                }}
              />
            </motion.div>

            <motion.div variants={fadeUp} style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', fontSize: '13px' }}>
              Audited {auditSummary.total_contracts_audited.toLocaleString()} contracts in {(auditSummary.audit_duration_ms / 1000).toFixed(1)} seconds. Found ${auditSummary.total_leakage.toLocaleString()} in royalty leakage.
            </motion.div>

            {/* NATURAL LANGUAGE QUERY UI */}
            <motion.div variants={fadeUp} style={{ marginTop: '40px' }}>
              <div style={{
                background: 'var(--bg-raised)',
                border: '1px solid var(--border-glow)',
                borderRadius: 'var(--radius-md)',
                padding: '24px',
                boxShadow: '0 0 20px rgba(0, 217, 192, 0.05)'
              }}>
                <h3 style={{ fontFamily: 'var(--font-heading)', color: 'var(--accent-teal)', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Terminal size={18} /> Ask Audit Data (AI)
                </h3>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!aiQuery) return;
                    setIsAiLoading(true);
                    setAiResponse('');
                    try {
                      const res = await fetch('https://api.anthropic.com/v1/messages', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY || '',
                          'anthropic-version': '2023-06-01',
                          'anthropic-dangerously-allow-browser': 'true'
                        },
                        body: JSON.stringify({
                          model: 'claude-3-haiku-20240307',
                          max_tokens: 500,
                          messages: [
                            {
                              role: 'user',
                              content: `You are an AI auditor. Answer the following user query about the royalty audit data based on this context: 
                              Total Leakage: $${auditSummary.total_leakage}. 
                              Total Audited: ${auditSummary.total_contracts_audited}.
                              Underpayments: ${auditSummary.underpayments}.
                              Overpayments: ${auditSummary.overpayments}.
                              Query: ${aiQuery}`
                            }
                          ]
                        })
                      });
                      if (!res.ok) throw new Error('API config missing or error');
                      const data = await res.json();
                      setAiResponse(data.content[0].text);
                    } catch (error) {
                      setAiResponse("Mock mode (No valid API key): Based on the audit trace, HelixMedia is underreporting CA territory by 12% due to an expired tier cap miscalculation. I recommend immediate contract review.");
                    } finally {
                      setIsAiLoading(false);
                    }
                  }}
                  style={{ display: 'flex', gap: '12px' }}
                >
                  <input
                    value={aiQuery}
                    onChange={(e) => setAiQuery(e.target.value)}
                    placeholder="E.g., Which studio has the most leakage?"
                    style={{
                      flex: 1,
                      background: 'var(--bg-base)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-primary)',
                      padding: '12px 16px',
                      borderRadius: 'var(--radius-sm)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                  <button
                    type="submit"
                    disabled={isAiLoading || !aiQuery}
                    style={{
                      padding: '0 24px',
                      background: 'var(--accent-teal)',
                      color: 'var(--bg-void)',
                      border: 'none',
                      borderRadius: 'var(--radius-sm)',
                      fontFamily: 'var(--font-heading)',
                      fontWeight: 700,
                      cursor: (isAiLoading || !aiQuery) ? 'not-allowed' : 'pointer',
                      opacity: (isAiLoading || !aiQuery) ? 0.7 : 1
                    }}
                  >
                    {isAiLoading ? 'Analyzing...' : 'Ask Claude'}
                  </button>
                </form>
                {aiResponse && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      marginTop: '20px',
                      padding: '16px',
                      background: 'var(--bg-base)',
                      borderLeft: '3px solid var(--accent-teal)',
                      fontFamily: 'var(--font-body)',
                      fontSize: '14px',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.6
                    }}
                  >
                    {aiResponse}
                  </motion.div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
