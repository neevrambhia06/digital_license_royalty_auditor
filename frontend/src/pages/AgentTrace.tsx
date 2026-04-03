import React, { useEffect, useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { auditService } from '../services/api';
import toast from 'react-hot-toast';
import { 
  Download, PlayCircle, StopCircle, Cpu, Layers, Activity, 
  Terminal as TerminalIcon, History, CheckCircle2, AlertCircle, 
  ChevronRight, Database, Search, FileText, BarChart3, ShieldCheck
} from 'lucide-react';

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

// Node definitions
const NODE_W = 160;
const NODE_H = 54;
const AGENT_NODES = [
  { id: 'PlannerAgent',          label: 'Planner Agent',   cx: 350, cy: 60, icon: <Cpu size={14} />  },
  { id: 'ContractReaderAgent',   label: 'Contract Reader', cx: 130, cy: 180, icon: <FileText size={14} /> },
  { id: 'StreamingLogAgent',     label: 'Usage Agent',     cx: 350, cy: 180, icon: <Database size={14} /> },
  { id: 'RoyaltyCalculatorAgent',label: 'Royalty Agent',   cx: 570, cy: 180, icon: <BarChart3 size={14} /> },
  { id: 'ViolationAgent',        label: 'Violation Agent', cx: 130, cy: 320, icon: <AlertCircle size={14} /> },
  { id: 'AuditAgent',            label: 'Audit Agent',     cx: 350, cy: 320, icon: <Search size={14} /> },
  { id: 'LedgerAgent',           label: 'Ledger Agent',    cx: 570, cy: 320, icon: <ShieldCheck size={14} /> },
  { id: 'ReporterAgent',         label: 'Reporter Agent',  cx: 350, cy: 440, icon: <Activity size={14} /> },
];

const EDGES = [
  ['PlannerAgent', 'ContractReaderAgent'],
  ['PlannerAgent', 'StreamingLogAgent'],
  ['PlannerAgent', 'RoyaltyCalculatorAgent'],
  ['RoyaltyCalculatorAgent', 'LedgerAgent'],
  ['LedgerAgent', 'AuditAgent'],
  ['AuditAgent', 'ViolationAgent'],
  ['ViolationAgent', 'ReporterAgent'],
  ['AuditAgent', 'ReporterAgent'],
];

function getNode(id: string) {
  return AGENT_NODES.find(n => n.id === id);
}

export default function AgentTrace() {
  const [traces, setTraces] = useState<TraceLine[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [activeAgents, setActiveAgents] = useState<Set<string>>(new Set());
  const [completedAgents, setCompletedAgents] = useState<Set<string>>(new Set());
  const [history, setHistory] = useState<RunHistory[]>([]);
  const terminalRef = useRef<HTMLDivElement>(null);
  const [runInstance, setRunInstance] = useState<string>('IDLE');

  const loadHistory = async () => {
    try {
      const allTraces = await auditService.getTraces();
      const runs: RunHistory[] = (Array.from(new Set(allTraces.map((t: any) => t.run_id as string))) as string[])
        .map((rid: string) => {
          const runTraces = allTraces.filter((t: any) => t.run_id === rid);
          return {
            run_id: rid,
            timestamp: runTraces[0]?.timestamp || '',
            duration_ms: runTraces.reduce((acc: number, t: any) => acc + (t.duration_ms || 0), 0),
            status: runTraces.some((t: any) => t.status === 'completed') ? 'completed' : 'running'
          };
        })
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 8);
      setHistory(runs);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => { loadHistory(); }, []);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [traces]);

  const startAudit = async () => {
    setTraces([]);
    setActiveAgents(new Set(['PlannerAgent']));
    setCompletedAgents(new Set());
    setIsRunning(true);
    setRunInstance('INITIALIZING');

    try {
      toast.loading("Initiating audit orchestration...", { id: 'trace-audit', icon: <Cpu className="text-gold" size={16} /> });
      
      const result = await auditService.runAudit();
      const runId = result.run_id;
      setRunInstance(runId.slice(0, 12).toUpperCase());
      
      // The audit is now running in the background. Start polling immediately.
      let pollCount = 0;
      const MAX_POLLS = 100; // Allow for roughly 2 minutes of execution
      
      const poll = async () => {
        // If the user cancelled or we're not running, stop
        if (pollCount > 0) {
           // We'll use a ref or check state if needed, but for now closure is okay
        }
        
        try {
          const updatedTraces = await auditService.getTraces(runId);
          const frontendTraces = updatedTraces.map((t: any) => ({
            id: t.trace_id,
            timestamp: new Date(t.timestamp).toLocaleTimeString('en-GB'),
            agent: t.agent_name,
            status: t.status,
            message: t.action,
            duration: t.duration_ms
          }));
          
          setTraces(frontendTraces);
          
          const active = new Set<string>();
          const completed = new Set<string>();
          frontendTraces.forEach((t: any) => {
            if (t.status === 'running') active.add(t.agent);
            if (t.status === 'completed') completed.add(t.agent);
          });
          setActiveAgents(active);
          setCompletedAgents(completed);
          
          // Check for final completion signal from ReporterAgent
          const isDone = updatedTraces.some((t: any) => t.agent_name === 'ReporterAgent' && t.status === 'completed');
          const hasError = updatedTraces.some((t: any) => t.status === 'error');
          
          if (hasError) {
             setIsRunning(false);
             toast.error("Audit pipeline failure detected.", { id: 'trace-audit' });
             return;
          }

          if (isDone) {
            setIsRunning(false);
            setActiveAgents(new Set());
            toast.success("Intelligence audit complete.", { id: 'trace-audit', duration: 4000 });
            loadHistory();
            return;
          }

          if (pollCount < MAX_POLLS) {
            pollCount++;
            setTimeout(poll, 1500);
          } else {
            setIsRunning(false);
            setActiveAgents(new Set());
            toast.error("Orchestrator timeout: Max duration exceeded.", { id: 'trace-audit' });
          }
        } catch (pollErr) {
          console.error("Poll error:", pollErr);
          // Retry on intermittent network errors
          if (pollCount < MAX_POLLS) {
            pollCount++;
            setTimeout(poll, 2000);
          }
        }
      };
      
      poll();
    } catch (e: any) {
      console.error("Audit initiation failed:", e);
      toast.error("Failed to connect to Orchestrator.", { id: 'trace-audit' });
      setIsRunning(false);
    }
  };

  const cancelAudit = () => {
    setIsRunning(false);
    toast.dismiss('trace-audit');
  };

  return (
    <div className="page-container" style={{ padding: 0, height: 'calc(100vh - 56px)', overflow: 'hidden', display: 'flex', background: '#FFFFFF' }}>
      
      {/* Sidebar: Pipeline & History */}
      <div style={{ width: '300px', background: 'var(--bg-base)', borderRight: '1px solid var(--border-surface)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '24px', borderBottom: '1px solid var(--border-subtle)' }}>
          <h2 className="mono" style={{ fontSize: '10px', color: 'var(--text-tertiary)', letterSpacing: '2px', marginBottom: '8px' }}>PIPELINE_ORCHESTRATOR</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {isRunning ? (
              <button className="btn-secondary" onClick={cancelAudit} style={{ border: '1px solid var(--crimson-dim)', color: 'var(--crimson-hot)' }}>
                <StopCircle size={14} /> HALT
              </button>
            ) : (
              <button className="btn-primary" onClick={startAudit} style={{ width: '100%' }}>
                <PlayCircle size={14} /> INITIATE AUDIT
              </button>
            )}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', padding: '0 8px' }}>
            <History size={14} className="text-gold" />
            <span className="mono" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>RECENT_RUNS</span>
          </div>
          
          {history.map(h => (
            <motion.div 
              key={h.run_id} 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              style={{ 
                padding: '12px', 
                borderRadius: '4px', 
                background: '#FFFFFF', 
                border: '1px solid rgba(0,0,0,0.08)',
                marginBottom: '10px',
                cursor: 'pointer'
              }}
              whileHover={{ borderColor: 'var(--gold-dim)', background: 'var(--gold-ghost)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span className="mono text-gold" style={{ fontSize: '10px' }}>{h.run_id.slice(0, 12)}</span>
                <span className={`badge ${h.status}`} style={{ fontSize: '8px', padding: '2px 6px' }}>{h.status.toUpperCase()}</span>
              </div>
              <div className="mono" style={{ fontSize: '9px', color: 'var(--text-tertiary)' }}>
                {new Date(h.timestamp).toLocaleString()} • {h.duration_ms}ms
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Main Area: Split between Diagram and Terminal */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#FFFFFF' }}>
        
        {/* Top: Agent Diagram */}
        <div style={{ height: '55%', position: 'relative', borderBottom: '1px solid var(--border-surface)', background: 'var(--bg-void)' }}>
          <div className="diamond-grid" style={{ position: 'absolute', inset: 0, opacity: 0.2 }} />
          
          <div style={{ position: 'absolute', top: '20px', left: '20px', display: 'flex', alignItems: 'center', gap: '12px', zIndex: 10 }}>
             <div className="pulse" style={{ width: '8px', height: '8px', background: isRunning ? 'var(--lime-bright)' : 'var(--text-tertiary)', borderRadius: '50%' }} />
             <span className="mono" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>SYSTEM_LOAD: {isRunning ? '48%' : '2%'}</span>
          </div>

          <svg width="100%" height="100%" viewBox="0 0 700 500" style={{ overflow: 'visible', pointerEvents: 'none' }}>
            <defs>
              <marker 
                id="arrowhead" 
                markerWidth="12" 
                markerHeight="12" 
                refX="11" 
                refY="6" 
                orient="auto" 
                markerUnits="userSpaceOnUse"
              >
                <path d="M0,2 L10,6 L0,10" fill="none" stroke="rgba(0,0,0,0.15)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </marker>
              <marker 
                id="arrowhead-active" 
                markerWidth="12" 
                markerHeight="12" 
                refX="11" 
                refY="6" 
                orient="auto" 
                markerUnits="userSpaceOnUse"
              >
                <path d="M0,2 L10,6 L0,10" fill="none" stroke="var(--gold-mid)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </marker>
            </defs>

            {/* Edges */}
            {EDGES.map(([fromId, toId], i) => {
              const from = getNode(fromId);
              const to = getNode(toId);
              if (!from || !to) return null;
              
              const isEdgeActive = activeAgents.has(fromId) || (completedAgents.has(fromId) && activeAgents.has(toId));
              const isEdgeDone = completedAgents.has(fromId) && completedAgents.has(toId);
              
              // Smart anchor selection
              const dx = to.cx - from.cx;
              const dy = to.cy - from.cy;
              
              let startX = from.cx;
              let startY = from.cy;
              let endX = to.cx;
              let endY = to.cy;

              if (Math.abs(dx) > Math.abs(dy) * 1.2) {
                startX += (dx > 0 ? NODE_W / 2 : -NODE_W / 2);
                endX += (dx > 0 ? -NODE_W / 2 : NODE_W / 2);
                endX += (dx > 0 ? -4 : 4);
              } else {
                startY += (dy > 0 ? NODE_H / 2 : -NODE_H / 2);
                endY += (dy > 0 ? -NODE_H / 2 : NODE_H / 2);
                endY += (dy > 0 ? -4 : 4);
              }

              let d = "";
              if (startX === endX || startY === endY) {
                d = `M ${startX} ${startY} L ${endX} ${endY}`;
              } else {
                if (Math.abs(dx) > Math.abs(dy) * 1.2) {
                  const cp1x = startX + (endX - startX) / 2;
                  const cp2x = startX + (endX - startX) / 2;
                  d = `M ${startX} ${startY} C ${cp1x} ${startY}, ${cp2x} ${endY}, ${endX} ${endY}`;
                } else {
                  const cp1y = startY + (endY - startY) / 2;
                  const cp2y = startY + (endY - startY) / 2;
                  d = `M ${startX} ${startY} C ${startX} ${cp1y}, ${endX} ${cp2y}, ${endX} ${endY}`;
                }
              }
              
              return (
                <g key={`edge-${i}`}>
                   <path
                    d={d}
                    fill="none"
                    stroke={isEdgeDone ? 'rgba(74, 124, 16, 0.2)' : 'rgba(0, 0, 0, 0.05)'}
                    strokeWidth="1"
                  />
                  <motion.path
                    d={d}
                    fill="none"
                    stroke={isEdgeActive ? 'var(--gold-mid)' : isEdgeDone ? 'var(--lime-bright)' : 'transparent'}
                    strokeWidth={isEdgeActive ? 2 : 1}
                    strokeDasharray={isEdgeActive ? '4 4' : 'none'}
                    markerEnd={isEdgeActive ? 'url(#arrowhead-active)' : 'url(#arrowhead)'}
                    initial={false}
                    animate={{ strokeDashoffset: isEdgeActive ? -20 : 0 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                </g>
              );
            })}

            {/* Nodes */}
            {AGENT_NODES.map((node) => {
              const isActive = activeAgents.has(node.id);
              const isDone = completedAgents.has(node.id);
              
              return (
                <g key={node.id} style={{ pointerEvents: 'auto', cursor: 'default' }}>
                  {/* Rotating border container (Problem 2) */}
                  {isActive && (
                    <foreignObject x={node.cx - NODE_W / 2 - 2} y={node.cy - NODE_H / 2 - 2} width={NODE_W + 4} height={NODE_H + 4}>
                      <div className="rotating-border" style={{ width: '100%', height: '100%', borderRadius: '4px' }} />
                    </foreignObject>
                  )}
                  
                  <rect 
                    x={node.cx - NODE_W / 2} y={node.cy - NODE_H / 2} width={NODE_W} height={NODE_H}
                    fill="#FFFFFF"
                    stroke={isActive ? 'var(--gold-mid)' : isDone ? 'var(--lime-bright)' : 'rgba(0,0,0,0.1)'}
                    strokeWidth={isActive ? '1' : '1'}
                    rx="4"
                    style={{ 
                      transition: 'all 0.4s',
                      boxShadow: isActive ? '0 4px 12px rgba(184, 134, 11, 0.15)' : 'none'
                    }}
                  />
                  <foreignObject x={node.cx - NODE_W / 2 + 10} y={node.cy - NODE_H / 2 + 10} width={NODE_W - 20} height={NODE_H - 20}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', height: '100%', color: isActive ? 'var(--gold-mid)' : isDone ? 'var(--lime-bright)' : 'var(--text-secondary)' }}>
                      {node.icon}
                      <span className="mono" style={{ fontSize: '11px', fontWeight: 600 }}>{node.label}</span>
                    </div>
                  </foreignObject>
                  {isActive && (
                    <circle cx={node.cx + NODE_W / 2 - 15} cy={node.cy - NODE_H / 2 + 15} r="2" fill="var(--gold-mid)">
                      <animate attributeName="opacity" values="1;0.2;1" dur="1s" repeatCount="indefinite" />
                    </circle>
                  )}
                  {isDone && (
                    <CheckCircle2 size={12} x={node.cx + NODE_W / 2 - 20} y={node.cy - NODE_H / 2 + 10} style={{ color: 'var(--lime-bright)' }} />
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Bottom: Terminal */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#F8F9FA' }}>
          <div style={{ 
            padding: '8px 24px', 
            background: 'var(--bg-elevated)', 
            borderBottom: '1px solid rgba(0,0,0,0.08)',
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <TerminalIcon size={14} className="text-gold" />
              <span className="mono" style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>LIVE_AGENT_TRACE :: {runInstance}</span>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
               <button className="btn-secondary" style={{ fontSize: '10px', padding: '4px 10px' }} onClick={() => setTraces([])}>CLEAR</button>
               <button className="btn-secondary" style={{ fontSize: '10px', padding: '4px 10px' }} onClick={() => toast('Exporting logs...')}>EXPORT</button>
            </div>
          </div>
          
          <div 
            ref={terminalRef}
            style={{ 
              flex: 1, 
              padding: '20px 24px', 
              overflowY: 'auto', 
              fontFamily: 'var(--font-mono)', 
              fontSize: '12px', 
              lineHeight: '1.7',
              color: 'var(--text-secondary)'
            }}
          >
            {traces.length === 0 && !isRunning && (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.3 }}>
                <span className="mono" style={{ color: 'var(--text-tertiary)' }}>SYSTEM_IDLE: AWAITING_COMMAND_INPUT_</span>
              </div>
            )}
            {traces.map((t, idx) => (
              <motion.div 
                key={t.id}
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                style={{ display: 'flex', gap: '16px', marginBottom: '4px' }}
              >
                <span style={{ color: 'var(--text-tertiary)', flexShrink: 0, width: '70px' }}>[{t.timestamp}]</span>
                <span className="mono" style={{ color: 'var(--gold-mid)', width: '130px', flexShrink: 0 }}>{t.agent}</span>
                <span style={{ color: t.status === 'error' ? 'var(--crimson-hot)' : 'var(--text-primary)' }}>
                  {t.message}
                </span>
                {t.duration && <span style={{ marginLeft: 'auto', color: 'var(--text-tertiary)', fontSize: '10px' }}>+{t.duration}ms</span>}
              </motion.div>
            ))}
            {isRunning && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--gold-mid)', marginTop: '4px' }}>
                <ChevronRight size={14} />
                <span className="blink">_</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .blink {
          animation: blink-anim 1s step-end infinite;
        }
        @keyframes blink-anim {
          50% { opacity: 0; }
        }
        .rotating-border {
          position: relative;
          background: #FFFFFF;
          padding: 2px;
        }
        .rotating-border::before {
          content: "";
          position: absolute;
          inset: 0;
          padding: 2px;
          border-radius: 4px;
          background: conic-gradient(from var(--angle), var(--gold-mid), transparent, var(--gold-mid));
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          animation: rotate 2s linear infinite;
        }
        @property --angle {
          syntax: "<angle>";
          initial-value: 0deg;
          inherits: false;
        }
        @keyframes rotate {
          to { --angle: 360deg; }
        }
        ::-webkit-scrollbar {
          width: 5px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background: rgba(0,0,0,0.05);
        }
        ::-webkit-scrollbar-thumb:hover {
          background: var(--gold-mid);
        }
      `}</style>
    </div>
  );
}

