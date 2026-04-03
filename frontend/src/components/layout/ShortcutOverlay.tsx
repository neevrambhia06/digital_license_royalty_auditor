import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, FileText, BarChart3, ShieldAlert, 
  Terminal, Zap, Database, DollarSign, Activity, ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { auditService } from '../../services/api';
import toast from 'react-hot-toast';

const SHORTCUTS = [
  { key: 'D', label: 'Go to Dashboard', path: '/dashboard', icon: <BarChart3 size={16} /> },
  { key: 'C', label: 'View Contracts', path: '/contracts', icon: <FileText size={16} /> },
  { key: 'L', label: 'Usage Logs', path: '/logs', icon: <Database size={16} /> },
  { key: 'P', label: 'Payment Ledger', path: '/payments', icon: <DollarSign size={16} /> },
  { key: 'V', label: 'Violation Intel', path: '/violations', icon: <ShieldAlert size={16} /> },
  { key: 'A', label: 'Agent Pipeline', path: '/trace', icon: <Terminal size={16} /> },
  { key: 'S', label: 'Leakage Summary', path: '/leakage-summary', icon: <Activity size={16} /> },
];

const SYSTEM_COMMANDS = [
  { id: 'generate', label: 'Generate Synthetic CSVs', action: 'generate', icon: <Zap size={16} />, description: 'Re-create 100k+ mock log entries' },
  { id: 'seed', label: 'Seed SQLite Database', action: 'seed', icon: <Database size={16} />, description: 'Ingest CSVs into local dLRA vault' },
  { id: 'audit', label: 'Run Full Agentic Audit', action: 'audit', icon: <Activity size={16} />, description: 'Trigger AuditOrchestrator pipeline' },
];

export default function ShortcutOverlay({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const [q, setQ] = useState('');

  const handleAction = async (action: string) => {
    onClose();
    const tid = toast.loading(`Executing ${action}...`, { id: 'sys-cmd' });
    try {
      if (action === 'generate') {
        await auditService.generateData();
        toast.success('Synthetic CSVs Generated Successfully', { id: 'sys-cmd' });
      } else if (action === 'seed') {
        await auditService.seedDatabase();
        toast.success('Database Seeded Successfully', { id: 'sys-cmd' });
        window.location.reload();
      } else if (action === 'audit') {
        await auditService.runAudit();
        toast.success('Agentic Audit Pipeline Started', { id: 'sys-cmd' });
        navigate('/trace');
      }
    } catch (err) {
      toast.error(`Execution failed: ${err}`, { id: 'sys-cmd' });
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onClose();
      }
      if (isOpen) {
        if (e.key === 'Escape') onClose();
        SHORTCUTS.forEach(s => {
          if (e.key.toLowerCase() === s.key.toLowerCase()) {
            navigate(s.path);
            onClose();
          }
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, navigate]);

  const filteredNav = SHORTCUTS.filter(s => s.label.toLowerCase().includes(q.toLowerCase()));
  const filteredSys = SYSTEM_COMMANDS.filter(s => s.label.toLowerCase().includes(q.toLowerCase()));

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', zIndex: 9999 }} 
          />
          <motion.div 
            initial={{ opacity: 0, y: -40, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            style={{ 
              position: 'fixed', left: '50%', top: '15vh', transform: 'translateX(-50%)',
              width: '100%', maxWidth: '640px', background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px) saturate(1.8)', border: '1px solid rgba(184, 134, 11, 0.2)',
              borderRadius: '0px', boxShadow: '0 24px 64px rgba(0,0,0,0.1), 0 0 1px rgba(0,0,0,0.1)',
              zIndex: 10000, overflow: 'hidden'
            }}
          >
            <div style={{ padding: '20px', borderBottom: '1px solid var(--border-surface)', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <Search className="text-gold" size={20} />
              <input 
                autoFocus placeholder="Type a command or search sections..."
                value={q} onChange={(e) => setQ(e.target.value)}
                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: '16px', fontFamily: 'var(--font-heading-refined)' }}
              />
              <div className="mono" style={{ fontSize: '10px', color: 'var(--text-tertiary)', background: 'var(--bg-base)', padding: '4px 8px', borderRadius: '4px' }}>ESC</div>
            </div>

            <div style={{ padding: '12px 0', maxHeight: '450px', overflowY: 'auto' }}>
              {filteredNav.length > 0 && (
                <>
                  <div className="mono" style={{ fontSize: '10px', color: 'var(--text-tertiary)', padding: '8px 24px', letterSpacing: '1px' }}>NAVIGATION_TARGETS</div>
                  {filteredNav.map((s) => (
                    <div key={s.key} onClick={() => { navigate(s.path); onClose(); }} className="shortcut-item" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px 24px', cursor: 'pointer', transition: 'all 0.2s' }}>
                      <div style={{ color: 'var(--text-tertiary)' }}>{s.icon}</div>
                      <span style={{ flex: 1, color: 'var(--text-secondary)', fontSize: '14px' }}>{s.label}</span>
                      <div className="mono" style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>JUMP_TO [{s.key}]</div>
                    </div>
                  ))}
                </>
              )}

              {filteredSys.length > 0 && (
                <>
                  <div className="mono" style={{ fontSize: '10px', color: 'var(--gold-dim)', padding: '16px 24px 8px', letterSpacing: '1px' }}>SYSTEM_INTELLIGENCE_COMMANDS</div>
                  {filteredSys.map((s) => (
                    <div key={s.id} onClick={() => handleAction(s.action)} className="shortcut-item sys" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px 24px', cursor: 'pointer', transition: 'all 0.2s' }}>
                      <div className="text-gold" style={{ filter: 'drop-shadow(0 0 8px rgba(232, 184, 75, 0.4))' }}>{s.icon}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ color: 'var(--text-primary)', fontSize: '14px' }}>{s.label}</div>
                        <div style={{ color: 'var(--text-tertiary)', fontSize: '11px' }}>{s.description}</div>
                      </div>
                      <div className="mono" style={{ fontSize: '9px', color: 'var(--gold-dim)', border: '1px solid var(--gold-dim)', padding: '2px 6px', borderRadius: '4px' }}>EXECUTE</div>
                    </div>
                  ))}
                </>
              )}
              
              {filteredNav.length === 0 && filteredSys.length === 0 && (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-tertiary)' }}>No matching commands.</div>
              )}
            </div>

            <div style={{ padding: '12px 24px', background: 'var(--bg-elevated)', borderTop: '1px solid var(--border-surface)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                  <div className="mono" style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>↑↓ : SELECT</div>
                  <div className="mono" style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>ENTER : EXECUTE</div>
               </div>
               <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Zap size={12} className="text-gold" />
                  <span className="mono" style={{ fontSize: '10px', color: 'var(--gold-mid)' }}>INTELLIGENCE_COMMAND_PALETTE_V1.1</span>
               </div>
            </div>
          </motion.div>
          <style>{`
            .shortcut-item:hover { background: rgba(0, 0, 0, 0.04); }
            .shortcut-item.sys:hover { background: rgba(184, 134, 11, 0.05); border-left: 2px solid var(--gold-mid); }
            .shortcut-item:hover span, .shortcut-item:hover .text-primary { color: var(--gold-bright) !important; }
            .shortcut-item .mono { border-radius: 0px !important; }
          `}</style>
        </>
      )}
    </AnimatePresence>
  );
}
