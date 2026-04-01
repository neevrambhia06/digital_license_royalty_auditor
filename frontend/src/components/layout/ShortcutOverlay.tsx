import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Command, Search, FileText, BarChart3, ShieldAlert, 
  Terminal, Settings, HelpCircle, X, Zap, 
  ChevronRight, Database, DollarSign, Activity
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SHORTCUTS = [
  { key: 'D', label: 'Go to Dashboard', path: '/dashboard', icon: <BarChart3 size={16} /> },
  { key: 'C', label: 'View Contracts', path: '/contracts', icon: <FileText size={16} /> },
  { key: 'L', label: 'Usage Logs', path: '/logs', icon: <Database size={16} /> },
  { key: 'P', label: 'Payment Ledger', path: '/payments', icon: <DollarSign size={16} /> },
  { key: 'V', label: 'Violation Intel', path: '/violations', icon: <ShieldAlert size={16} /> },
  { key: 'A', label: 'Agent Pipeline', path: '/trace', icon: <Terminal size={16} /> },
  { key: 'S', label: 'Leakage Summary', path: '/leakage-summary', icon: <Activity size={16} /> },
];

export default function ShortcutOverlay({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const [q, setQ] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onClose(); // Toggle mechanism is handled by parent, but we close if already open
      }
      if (isOpen) {
        if (e.key === 'Escape') onClose();
        // Custom shortcuts while open
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

  const filtered = SHORTCUTS.filter(s => 
    s.label.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ 
              position: 'fixed', 
              inset: 0, 
              background: 'rgba(0,0,0,0.6)', 
              backdropFilter: 'blur(8px)',
              zIndex: 9999
            }} 
          />
          <motion.div 
            initial={{ opacity: 0, y: -40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            style={{ 
              position: 'fixed', 
              left: '50%', 
              top: '15vh', 
              transform: 'translateX(-50%)',
              width: '100%',
              maxWidth: '640px',
              background: 'rgba(7, 7, 15, 0.92)',
              backdropFilter: 'blur(20px) saturate(1.6)',
              WebkitBackdropFilter: 'blur(20px) saturate(1.6)',
              border: '1px solid rgba(232, 184, 75, 0.25)',
              borderRadius: '8px',
              boxShadow: '0 32px 128px rgba(0,0,0,0.8), 0 0 40px rgba(198, 172, 118, 0.15)',
              zIndex: 10000,
              overflow: 'hidden'
            }}
          >
            <div style={{ padding: '20px', borderBottom: '1px solid var(--border-surface)', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <Search className="text-gold" size={20} />
              <input 
                autoFocus
                placeholder="Type a command or search sections..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                style={{ 
                  flex: 1, 
                  background: 'transparent', 
                  border: 'none', 
                  outline: 'none', 
                  color: 'var(--text-primary)',
                  fontSize: '16px',
                  fontFamily: 'var(--font-heading-refined)'
                }}
              />
              <div className="mono" style={{ fontSize: '10px', color: 'var(--text-tertiary)', background: 'var(--bg-base)', padding: '4px 8px', borderRadius: '4px' }}>ESC</div>
            </div>

            <div style={{ padding: '12px 0', maxHeight: '400px', overflowY: 'auto' }}>
              <div className="mono" style={{ fontSize: '10px', color: 'var(--text-tertiary)', padding: '8px 24px', letterSpacing: '1px' }}>NAVIGATION_TARGETS</div>
              {filtered.map((s) => (
                <div 
                  key={s.key}
                  onClick={() => { navigate(s.path); onClose(); }}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '16px', 
                    padding: '12px 24px', 
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  className="shortcut-item"
                >
                  <div style={{ color: 'var(--text-tertiary)' }}>{s.icon}</div>
                  <span style={{ flex: 1, color: 'var(--text-secondary)', fontSize: '14px' }}>{s.label}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span className="mono" style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>JUMP_TO</span>
                    <div style={{ 
                      width: '20px', height: '20px', border: '1px solid var(--border-surface)', 
                      borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '11px', fontWeight: 600, color: 'var(--gold-bright)', background: 'var(--bg-base)'
                    }}>
                      {s.key}
                    </div>
                  </div>
                </div>
              ))}
              {filtered.length === 0 && (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                   No matching commands found.
                </div>
              )}
            </div>

            <div style={{ padding: '12px 24px', background: 'var(--bg-base)', borderTop: '1px solid var(--border-surface)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ChevronRight size={12} className="text-gold" />
                    <span className="mono" style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>TAB: SELECT</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ChevronRight size={12} className="text-gold" />
                    <span className="mono" style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>ENTER: EXECUTE</span>
                  </div>
               </div>
               <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Zap size={12} className="text-gold" />
                  <span className="mono" style={{ fontSize: '10px', color: 'var(--gold-dim)' }}>INTELLIGENCE_COMMAND_PALETTE_V1.0</span>
               </div>
            </div>
          </motion.div>
          <style>{`
            .shortcut-item:hover {
              background: rgba(198, 172, 118, 0.05);
            }
            .shortcut-item:hover span {
              color: var(--gold-bright) !important;
            }
          `}</style>
        </>
      )}
    </AnimatePresence>
  );
}
