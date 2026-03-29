import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, AlertTriangle, Info, CheckCircle, ShieldAlert, Download, Terminal, X } from 'lucide-react';
import Badge from '../components/ui/Badge';
import { violationAgent, Violation } from '../agents/violationAgent';
import { auditLogGenerator } from '../agents/auditLogGenerator';
import { supabase } from '../lib/supabase';

// Helper component for animating numbers if needed
function StatCard({ label, value, color, icon: Icon }: { label: string, value: number, color: string, icon: any }) {
  return (
    <motion.div 
      whileHover={{ scale: 1.02, borderColor: color }}
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        padding: '24px',
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
        transition: 'border-color 0.2s ease'
      }}
    >
      <div style={{ padding: '16px', borderRadius: '50%', background: `color-mix(in srgb, ${color} 10%, transparent)` }}>
        <Icon size={32} color={color} />
      </div>
      <div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '36px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>
          {value}
        </div>
        <div style={{ fontFamily: 'var(--font-heading)', fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {label}
        </div>
      </div>
    </motion.div>
  );
}

export default function ViolationsPage() {
  const [violations, setViolations] = useState<Violation[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedViolation, setSelectedViolation] = useState<Violation | null>(null);
  
  // Filters
  const [activeSeverity, setActiveSeverity] = useState<string>('all');
  const [activeType, setActiveType] = useState<string>('all');
  
  const endOfLogsRef = useRef<HTMLDivElement>(null);

  const fetchLogs = async (runId: string) => {
    const traceLogs = await auditLogGenerator.getFullLog(runId);
    setLogs(traceLogs);
  };

  const executeChecks = async () => {
    setIsLoading(true);
    try {
      // The violation agent generates a new run_id inherently or passes one through the traces.
      // We will generate a runId for this cycle
      const runId = Math.random().toString(36).substring(2, 10);
      
      const results = await violationAgent.checkAllViolations(runId);
      
      // Let's refetch from DB so we get everything, not just what this run detected (or maybe just what we have)
      const { data } = await supabase.from('violations').select('*').order('detected_at', { ascending: false });
      setViolations(data || results);
      
      await fetchLogs(runId);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch from DB
  useEffect(() => {
    const loadInit = async () => {
      const { data } = await supabase.from('violations').select('*').order('detected_at', { ascending: false });
      setViolations(data || []);
      
      // Load latest active traces if any
      const { data: latestTrace } = await supabase.from('agent_traces').select('run_id').order('timestamp', { ascending: false }).limit(1);
      if (latestTrace && latestTrace[0]) {
        await fetchLogs(latestTrace[0].run_id);
      }
      setIsLoading(false);
    };
    loadInit();
  }, []);

  useEffect(() => {
    endOfLogsRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const handleExport = async () => {
    if (logs.length === 0) return;
    const runId = logs[0].run_id;
    const csvStr = await auditLogGenerator.exportLog(runId);
    
    const blob = new Blob([csvStr], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_trace_${runId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleMarkReviewed = async (v_id: string) => {
    const timestamp = new Date().toISOString();
    await supabase.from('violations').update({ reviewed_at: timestamp }).eq('violation_id', v_id);
    setViolations(prev => prev.map(v => v.violation_id === v_id ? { ...v, reviewed_at: timestamp } : v));
    setSelectedViolation(null);
  };

  useEffect(() => {
    const onGlobalExport = () => handleExport();
    window.addEventListener('export:csv', onGlobalExport);
    return () => window.removeEventListener('export:csv', onGlobalExport);
  }, [logs]);

  const filtered = violations.filter(v => {
    if (activeSeverity !== 'all' && v.severity !== activeSeverity) return false;
    if (activeType !== 'all' && v.violation_type !== activeType) return false;
    return true;
  });

  const getSeverityColor = (sev: string) => {
    switch(sev) {
      case 'critical': return 'var(--danger)';
      case 'high': return '#F97316'; // Orange
      case 'medium': return 'var(--accent-amber)';
      default: return 'var(--success)';
    }
  };

  const stats = {
    critical: violations.filter(v => v.severity === 'critical' && !v.reviewed_at).length,
    high: violations.filter(v => v.severity === 'high' && !v.reviewed_at).length,
    medium: violations.filter(v => v.severity === 'medium' && !v.reviewed_at).length,
    low: violations.filter(v => v.severity === 'low' && !v.reviewed_at).length,
  };

  const uniqueTypes = Array.from(new Set(violations.map(v => v.violation_type)));

  return (
    <div style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '32px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            Violations & Compliance
          </h1>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', color: 'var(--text-muted)', marginTop: '8px' }}>
            {violations.filter(v => !v.reviewed_at).length} active issues require review
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={executeChecks}
            disabled={isLoading}
            style={{
              padding: '10px 20px',
              fontFamily: 'var(--font-heading)',
              fontWeight: 600,
              fontSize: '14px',
              color: 'var(--bg-base)',
              background: 'var(--accent-teal)',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              cursor: isLoading ? 'wait' : 'pointer',
              opacity: isLoading ? 0.7 : 1,
              boxShadow: '0 0 15px rgba(0, 217, 192, 0.2)'
            }}
          >
            {isLoading ? 'Scanning...' : 'Run New Scan'}
          </button>
        </div>
      </div>

      {/* STATS ROW */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        <StatCard label="Critical" value={stats.critical} color="var(--danger)" icon={ShieldAlert} />
        <StatCard label="High" value={stats.high} color="#F97316" icon={AlertCircle} />
        <StatCard label="Medium" value={stats.medium} color="var(--accent-amber)" icon={AlertTriangle} />
        <StatCard label="Low" value={stats.low} color="var(--success)" icon={Info} />
      </div>

      {/* FILTER BAR */}
      <div style={{ display: 'flex', gap: '20px', alignItems: 'center', padding: '16px', background: 'var(--bg-raised)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-muted)' }}>SEVERITY</div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {['all', 'critical', 'high', 'medium', 'low'].map(sev => (
            <button
              key={sev}
              onClick={() => setActiveSeverity(sev)}
              style={{
                padding: '4px 12px',
                borderRadius: '50px',
                background: activeSeverity === sev ? 'var(--text-primary)' : 'transparent',
                color: activeSeverity === sev ? 'var(--bg-base)' : 'var(--text-secondary)',
                border: `1px solid ${activeSeverity === sev ? 'var(--text-primary)' : 'var(--border-subtle)'}`,
                cursor: 'pointer',
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
                textTransform: 'uppercase'
              }}
            >
              {sev}
            </button>
          ))}
        </div>
        
        <div style={{ width: '1px', height: '24px', background: 'var(--border-subtle)', margin: '0 10px' }} />
        
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-muted)' }}>TYPE</div>
        <select 
          value={activeType} 
          onChange={(e) => setActiveType(e.target.value)}
          style={{
            background: 'var(--bg-base)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-subtle)',
            padding: '6px 12px',
            borderRadius: '4px',
            fontFamily: 'var(--font-mono)',
            fontSize: '13px',
            outline: 'none'
          }}
        >
          <option value="all">ALL TYPES</option>
          {uniqueTypes.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        
        <div style={{ flex: 1 }} />
        
        <button
          onClick={handleExport}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '6px 16px',
            background: 'transparent',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '4px',
            cursor: 'pointer',
            fontFamily: 'var(--font-mono)',
            fontSize: '12px'
          }}
        >
          <Download size={14} /> EXPORT CSV
        </button>
      </div>

      {/* VIOLATION FEED */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
        <AnimatePresence>
          {filtered.map((v, i) => (
            <motion.div
              key={v.violation_id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ delay: i * 0.03, duration: 0.2 }}
              whileHover={{ scale: 1.005, borderColor: 'var(--border-glow)' }}
              onClick={() => setSelectedViolation(v)}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                overflow: 'hidden',
                cursor: 'pointer',
                opacity: v.reviewed_at ? 0.6 : 1
              }}
            >
              <div style={{ width: '6px', background: getSeverityColor(v.severity) }} />
              <div style={{ padding: '20px', width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <Badge type={v.violation_type.toLowerCase()}>{v.violation_type}</Badge>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--text-primary)' }}>{v.content_id}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-muted)' }}>{v.contract_id}</span>
                  </div>
                  {v.reviewed_at && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--success)', fontFamily: 'var(--font-mono)' }}>
                      <CheckCircle size={12} /> REVIEWED
                    </span>
                  )}
                </div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {v.description}
                </div>
                <div style={{ marginTop: '16px', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>
                  Detected: {new Date(v.detected_at).toLocaleString()} • Audit ID: {v.audit_id}
                </div>
              </div>
            </motion.div>
          ))}
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '64px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              No violations match the current filter criteria.
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* FULL AUDIT LOG - TERMINAL SECTION */}
      <div style={{ 
        marginTop: '32px', 
        background: '#040608', // Even darker for terminal
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
      }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Terminal size={16} color="var(--text-muted)" />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-muted)' }}>Audit Engine Trace Log</span>
        </div>
        <div style={{
          padding: '16px',
          height: '250px',
          overflowY: 'auto',
          fontFamily: 'var(--font-mono)',
          fontSize: '12px',
          lineHeight: 1.6
        }}>
          {logs.map((log, i) => (
            <div key={log.trace_id} style={{ display: 'flex', gap: '12px', marginBottom: '4px' }}>
              <span style={{ color: 'var(--text-muted)', minWidth: '150px' }}>[{new Date(log.timestamp).toISOString().split('T')[1].slice(0, 8)}]</span>
              <span style={{ color: 'var(--accent-purple)', minWidth: '130px' }}>{log.agent_name}</span>
              <span style={{ color: 'var(--accent-teal)' }}>{log.action}</span>
              <span style={{ color: 'var(--text-secondary)' }}>→ {log.output_summary || log.input_summary}</span>
              {log.duration_ms && <span style={{ color: 'var(--text-muted)' }}>[{log.duration_ms}ms]</span>}
            </div>
          ))}
          <div ref={endOfLogsRef} style={{ animation: 'blink 1s step-end infinite', width: '8px', height: '14px', background: 'var(--text-muted)', marginTop: '8px' }} />
        </div>
      </div>

      {/* VIOLATION DETAIL MODAL */}
      <AnimatePresence>
        {selectedViolation && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setSelectedViolation(null)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(8, 11, 15, 0.8)', zIndex: 99, backdropFilter: 'blur(4px)' }} 
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              style={{
                position: 'fixed',
                bottom: 0,
                left: '10%',
                right: '10%',
                height: '70vh',
                background: 'var(--bg-raised)',
                border: '1px solid var(--border-subtle)',
                borderBottom: 'none',
                borderRadius: '24px 24px 0 0',
                zIndex: 100,
                padding: '40px',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 -20px 40px rgba(0,0,0,0.5)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
                <div>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
                    <Badge type={selectedViolation.violation_type.toLowerCase()}>{selectedViolation.violation_type}</Badge>
                    <span style={{ color: getSeverityColor(selectedViolation.severity), fontFamily: 'var(--font-mono)', fontSize: '13px', textTransform: 'uppercase' }}>
                      {selectedViolation.severity} SEVERITY
                    </span>
                  </div>
                  <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '24px', color: 'var(--text-primary)', margin: '0 0 8px' }}>
                    {selectedViolation.description}
                  </h2>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--accent-teal)' }}>
                    ID: {selectedViolation.violation_id}
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedViolation(null)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  <X size={24} />
                </button>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <h3 style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)', marginTop: 0 }}>Context Details</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Content</span><span>{selectedViolation.content_id}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Contract</span><span>{selectedViolation.contract_id}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Detected At</span><span>{new Date(selectedViolation.detected_at).toLocaleString()}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Audit Block</span><span>{selectedViolation.audit_id}</span></div>
                  </div>
                </div>

                <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <h3 style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)', marginTop: 0 }}>Recommended Action</h3>
                  <p style={{ fontFamily: 'var(--font-body)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    {selectedViolation.violation_type === 'EXPIRED LICENSE' && "Immediately suspend distribution rights for this content until a renewed contract is finalized. Review historical payments post-expiry."}
                    {selectedViolation.violation_type === 'TERRITORY VIOLATION' && "Investigate CDN logs for geofencing failures. Notify rights holders of the violation and calculate potential damages."}
                    {selectedViolation.violation_type === 'WRONG_TIER' && "Trigger a ledger recalculation. Issue credits or debit notes on the subsequent payment cycle to reconcile the tier threshold variation."}
                    {selectedViolation.violation_type === 'MISSING_LICENSE' && "Halt playback for this content ID globally. This presents a high legal liability risk for copyright infringement without terms."}
                  </p>
                </div>
              </div>

              <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '16px', borderTop: '1px solid var(--border-subtle)', paddingTop: '24px' }}>
                <button
                  onClick={() => setSelectedViolation(null)}
                  style={{ padding: '12px 24px', background: 'transparent', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontFamily: 'var(--font-heading)' }}
                >
                  Close
                </button>
                <button
                  onClick={() => handleMarkReviewed(selectedViolation.violation_id)}
                  disabled={!!selectedViolation.reviewed_at}
                  style={{ 
                    padding: '12px 24px', 
                    background: selectedViolation.reviewed_at ? 'var(--bg-base)' : 'var(--success)', 
                    border: 'none', 
                    color: selectedViolation.reviewed_at ? 'var(--text-muted)' : 'var(--bg-void)', 
                    borderRadius: 'var(--radius-sm)', 
                    cursor: selectedViolation.reviewed_at ? 'not-allowed' : 'pointer', 
                    fontFamily: 'var(--font-heading)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <CheckCircle size={18} />
                  {selectedViolation.reviewed_at ? 'Already Reviewed' : 'Mark as Reviewed'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      
      <style>{`
        @keyframes blink { 0% { opacity: 1; } 50% { opacity: 0; } 100% { opacity: 1; } }
      `}</style>
    </div>
  );
}
