import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { Download, PlayCircle, Loader2, StopCircle, RefreshCw, XCircle } from 'lucide-react';
import { auditOrchestrator } from '../agents/auditOrchestrator';

type TraceLine = {
  id: string;
  timestamp: string;
  agent: string;
  status: 'running' | 'completed' | 'error';
  message: string;
  duration?: number;
};

type RunHistory = {
  run_id: string;
  timestamp: string;
  duration_ms: number;
  status: string;
};

// SVG Flow diagram nodes mapping
const AGENT_NODES = [
  { id: 'PlannerAgent', label: 'Planner Agent', x: 250, y: 50 },
  { id: 'ContractReaderAgent', label: 'Contract Reader', x: 50, y: 150 },
  { id: 'StreamingLogAgent', label: 'Usage Agent', x: 250, y: 150 },
  { id: 'RoyaltyCalculatorAgent', label: 'Royalty Agent', x: 450, y: 150 },
  { id: 'LedgerAgent', label: 'Ledger Agent', x: 450, y: 300 },
  { id: 'AuditAgent', label: 'Audit Agent', x: 250, y: 300 },
  { id: 'ViolationAgent', label: 'Violation Agent', x: 50, y: 300 },
  { id: 'ReporterAgent', label: 'Reporter Agent', x: 250, y: 400 }
];

export default function AgentTrace() {
  const [traces, setTraces] = useState<TraceLine[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [activeAgents, setActiveAgents] = useState<Set<string>>(new Set());
  const [completedAgents, setCompletedAgents] = useState<Set<string>>(new Set());
  const [history, setHistory] = useState<RunHistory[]>([]);
  const terminalRef = useRef<HTMLDivElement>(null);
  const [runInstance, setRunInstance] = useState<string>('Standby');

  const loadHistory = async () => {
    try {
      const hist = await auditOrchestrator.getRunHistory();
      setHistory(hist);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadHistory();

    const handleTraceEvent = (e: CustomEvent) => {
      const { agent, status, message, duration } = e.detail;
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}:${now.getSeconds().toString().padStart(2,'0')}.${now.getMilliseconds().toString().padStart(3,'0')}`;

      setTraces(prev => [...prev, {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: timeStr,
        agent,
        status,
        message,
        duration
      }]);

      if (status === 'running') {
        setActiveAgents(prev => new Set(prev).add(agent));
        setCompletedAgents(prev => { const s = new Set(prev); s.delete(agent); return s; });
      } else if (status === 'completed') {
        setActiveAgents(prev => { const s = new Set(prev); s.delete(agent); return s; });
        setCompletedAgents(prev => new Set(prev).add(agent));
      } else if (status === 'error') {
        setActiveAgents(prev => { const s = new Set(prev); s.delete(agent); return s; });
      }
    };

    window.addEventListener('agent:step', handleTraceEvent as EventListener);
    return () => window.removeEventListener('agent:step', handleTraceEvent as EventListener);
  }, []);

  // Auto-scroll terminal
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [traces]);

  const startAudit = async () => {
    setTraces([]);
    setActiveAgents(new Set(['PlannerAgent'])); // Implicit planner start
    setCompletedAgents(new Set());
    setIsRunning(true);
    setRunInstance('Starting...');

    try {
      const summary = await auditOrchestrator.runCompleteAudit();
      setRunInstance(summary.run_id);
      setActiveAgents(new Set());
      setCompletedAgents(new Set(AGENT_NODES.map(a => a.id))); // mark all complete mostly
    } catch (e: any) {
      console.error("Audit aborted:", e.message);
    } finally {
      setIsRunning(false);
      setActiveAgents(new Set());
      loadHistory();
    }
  };

  const cancelAudit = () => {
    auditOrchestrator.cancelAudit();
    setIsRunning(false);
  };

  const downloadJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(traces, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `audit_trace_${runInstance}.json`);
    dlAnchorElem.click();
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-void)' }}>
      
      {/* LEFT COLUMN: 40% (Flow Diagram) */}
      <div style={{ width: '40%', borderRight: '1px solid var(--border-subtle)', padding: '40px', display: 'flex', flexDirection: 'column' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '24px', color: 'var(--text-primary)', margin: 0 }}>Agent Architecture</h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--text-muted)' }}>Live orchestration nodes mapping standard sequential logic</p>
        </div>

        <div style={{ flex: 1, position: 'relative', marginTop: '40px', overflow: 'visible' }}>
          <svg width="100%" height="500" viewBox="0 0 600 500" style={{ overflow: 'visible' }}>
            <defs>
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Render connecting lines based on explicit pathing */}
            <path d="M 350 75 L 150 175" stroke="var(--border-subtle)" strokeWidth="2" fill="none" />
            <path d="M 350 75 L 350 175" stroke="var(--border-subtle)" strokeWidth="2" fill="none" />
            <path d="M 350 75 L 550 175" stroke="var(--border-subtle)" strokeWidth="2" fill="none" />
            
            <path d="M 550 200 L 550 300" stroke="var(--border-subtle)" strokeWidth="2" fill="none" />
            <path d="M 550 325 L 350 325" stroke="var(--border-subtle)" strokeWidth="2" fill="none" />
            <path d="M 350 325 L 150 325" stroke="var(--border-subtle)" strokeWidth="2" fill="none" />
            <path d="M 150 325 L 350 400" stroke="var(--border-subtle)" strokeWidth="2" fill="none" />

            {/* Render Nodes */}
            {AGENT_NODES.map((node) => {
              const isActive = activeAgents.has(node.id);
              const isDone = completedAgents.has(node.id);
              // Basic color mapping
              let fillColor = 'var(--bg-card)';
              let borderColor = 'var(--border-subtle)';
              let textColor = 'var(--text-secondary)';

              if (isActive) {
                fillColor = 'var(--bg-card-hover)';
                borderColor = 'var(--border-glow)';
                textColor = 'var(--accent-teal)';
              } else if (isDone) {
                fillColor = 'rgba(0, 217, 192, 0.1)';
                borderColor = 'var(--accent-teal)';
                textColor = 'var(--accent-teal)';
              }

              // Latest message search
              const lastRelevantMsg = [...traces].reverse().find(t => t.agent === node.id)?.message || '';

              return (
                <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
                  <rect 
                    x="0" y="0" width="200" height="50" rx="6"
                    fill={fillColor}
                    stroke={borderColor}
                    strokeWidth="2"
                    filter={isActive ? 'url(#glow)' : ''}
                    style={{ transition: 'all 0.3s' }}
                  />
                  <text x="100" y="30" textAnchor="middle" fill={textColor} style={{ fontFamily: 'var(--font-heading)', fontSize: '13px', fontWeight: 'bold' }}>
                    {node.label}
                  </text>
                  {lastRelevantMsg && (
                    <text x="100" y="70" textAnchor="middle" fill="var(--text-muted)" style={{ fontFamily: 'var(--font-mono)', fontSize: '10px' }}>
                      {lastRelevantMsg.slice(0, 30)}{lastRelevantMsg.length > 30 ? '...' : ''}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* RIGHT COLUMN: 60% (Terminal Wrapper) */}
      <div style={{ width: '60%', padding: '40px', display: 'flex', flexDirection: 'column' }}>
        
        {/* Terminal Header Chrome */}
        <div style={{ background: 'var(--bg-raised)', border: '1px solid var(--border-subtle)', borderBottom: 'none', borderRadius: '12px 12px 0 0', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--danger)' }} />
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--warning)' }} />
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--success)' }} />
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--text-muted)' }}>
            Agent Trace — Run {runInstance}
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            {isRunning ? (
              <button onClick={cancelAudit} style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'var(--font-heading)', fontSize: '12px' }}>
                <StopCircle size={16} /> Halt
              </button>
            ) : (
              <button onClick={startAudit} style={{ background: 'var(--accent-teal)', border: 'none', borderRadius: '4px', padding: '6px 12px', color: 'var(--bg-void)', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'var(--font-heading)', fontSize: '12px' }}>
                <PlayCircle size={16} /> Start
              </button>
            )}
            <button onClick={downloadJSON} style={{ background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: '4px', padding: '6px 12px', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'var(--font-heading)', fontSize: '12px' }}>
              <Download size={16} /> JSON
            </button>
          </div>
        </div>

        {/* Live Terminal Content */}
        <div ref={terminalRef} style={{ background: '#05070A', border: '1px solid var(--border-subtle)', borderRadius: '0 0 12px 12px', flex: 1, padding: '24px', overflowY: 'auto', maxHeight: '500px', fontFamily: 'var(--font-mono)', fontSize: '13px', lineHeight: 1.6, scrollBehavior: 'smooth' }}>
          {traces.length === 0 && !isRunning && (
            <div style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '100px' }}>Waiting for execution signal... Initialize master orchestrator.</div>
          )}
          {traces.map(t => (
            <div key={t.id} style={{ display: 'flex', gap: '12px', marginBottom: '4px', minWidth: 0 }}>
              <span style={{ color: 'rgba(139, 160, 181, 0.3)', flexShrink: 0 }}>[{t.timestamp}]</span>
              
              {t.status === 'running' && <span style={{ color: 'var(--warning)', minWidth: '16px', flexShrink: 0 }}>►</span>}
              {t.status === 'completed' && <span style={{ color: 'var(--success)', minWidth: '16px', flexShrink: 0 }}>✓</span>}
              {t.status === 'error' && <span style={{ color: 'var(--danger)', minWidth: '16px', flexShrink: 0 }}>✗</span>}

              <span style={{ color: 'var(--accent-teal)', fontWeight: 'bold', width: '160px', flexShrink: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.agent}</span>
              <span style={{ color: 'var(--text-primary)', flex: 1, wordBreak: 'break-word' }}>{t.message}</span>
              
              {t.duration !== undefined && (
                <span style={{ color: 'var(--text-muted)', textAlign: 'right', flexShrink: 0, minWidth: '60px' }}>+{t.duration}ms</span>
              )}
            </div>
          ))}
          {/* Animated Blinking Cursor */}
          {isRunning && (
            <div style={{ display: 'flex', gap: '12px', marginTop: '8px', animation: 'blink 1s infinite' }}>
              <span style={{ background: 'var(--text-primary)', width: '8px', height: '16px', display: 'inline-block' }} />
            </div>
          )}
        </div>

        {/* Action History Component */}
        <div style={{ marginTop: '40px' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '16px', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '16px', margin: '0 0 16px' }}>Run History (Last 10 Executions)</h3>
          <table style={{ width: '100%', textAlign: 'left', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
            <thead>
              <tr style={{ color: 'var(--text-muted)' }}>
                <th style={{ padding: '12px 0' }}>Run ID</th>
                <th>Timestamp</th>
                <th>Duration</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {history.map(h => (
                <tr key={h.run_id} style={{ borderBottom: '1px solid rgba(31, 45, 61, 0.4)' }}>
                  <td style={{ padding: '12px 0', color: 'var(--accent-purple)' }}>{h.run_id}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{new Date(h.timestamp).toLocaleString()}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{h.duration_ms}ms</td>
                  <td>
                    {h.status === 'completed' || h.status === 'success' ? (
                      <span style={{ color: 'var(--success)', padding: '2px 8px', background: 'rgba(34, 197, 94, 0.1)', borderRadius: '12px' }}>✔ SUCCESS</span>
                    ) : h.status === 'cancelled' ? (
                      <span style={{ color: 'var(--warning)', padding: '2px 8px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '12px' }}>■ CANCELED</span>
                    ) : (
                      <span style={{ color: 'var(--danger)', padding: '2px 8px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '12px' }}>✖ ERROR</span>
                    )}
                  </td>
                </tr>
              ))}
              {history.length === 0 && (
                <tr><td colSpan={4} style={{ padding: '16px 0', color: 'var(--text-muted)' }}>No historical traces.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
