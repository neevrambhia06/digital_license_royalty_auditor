import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, FileText, Calendar, AlertTriangle, FileBarChart, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { exportToCSV } from '../utils/exportUtils';

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const actions = [
    { id: 'run-audit', title: 'Run New Audit', icon: Play, action: () => navigate('/trace') },
    { id: 'export-csv', title: 'Export Current View to CSV', icon: FileBarChart, action: () => {
      // Basic global event dispatch so local pages can handle it if needed
      window.dispatchEvent(new CustomEvent('export:csv'));
    }},
    { id: 'nav-dashboard', title: 'Go to Dashboard', icon: FileBarChart, action: () => navigate('/dashboard') },
    { id: 'nav-contracts', title: 'Go to Contracts', icon: FileText, action: () => navigate('/contracts') },
    { id: 'nav-payments', title: 'Go to Payments', icon: Calendar, action: () => navigate('/payments') },
    { id: 'nav-violations', title: 'Go to Violations', icon: AlertTriangle, action: () => navigate('/violations') },
  ];

  const filtered = actions.filter(a => a.title.toLowerCase().includes(search.toLowerCase()));

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(o => !o);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'r') {
        // Prevent browser refresh if we want this specific shortcut
        // But overriding refresh might be annoying outside the modal.
        // We'll trust the user spec: Cmd+R -> run new audit
        e.preventDefault();
        navigate('/trace');
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'e') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('export:csv'));
      }
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSelectedIndex(0);
    } else {
      setSearch('');
    }
  }, [isOpen]);

  const handleExecute = (index: number) => {
    if (filtered[index]) {
      filtered[index].action();
      setIsOpen(false);
    }
  };

  const handleLocalKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => (i + 1) % filtered.length);
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => (i - 1 + filtered.length) % filtered.length);
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      handleExecute(selectedIndex);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <React.Fragment>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(8, 11, 15, 0.8)',
              backdropFilter: 'blur(4px)',
              zIndex: 9999
            }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            style={{
              position: 'fixed',
              top: '20vh',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '90%',
              maxWidth: '600px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,217,192,0.1)',
              zIndex: 10000,
              overflow: 'hidden'
            }}
          >
            <div style={{ padding: '16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Search size={20} color="var(--accent-teal)" />
              <input
                ref={inputRef}
                value={search}
                onChange={e => { setSearch(e.target.value); setSelectedIndex(0); }}
                onKeyDown={handleLocalKeyDown}
                placeholder="Search commands or jump to..."
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-heading)',
                  fontSize: '18px'
                }}
              />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)', padding: '2px 6px', borderRadius: '4px' }}>ESC</span>
            </div>
            
            <div style={{ padding: '8px', maxHeight: '300px', overflowY: 'auto' }}>
              {filtered.map((item, i) => (
                <div
                  key={item.id}
                  onClick={() => handleExecute(i)}
                  onMouseEnter={() => setSelectedIndex(i)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 16px',
                    cursor: 'pointer',
                    borderRadius: '4px',
                    background: i === selectedIndex ? 'rgba(0, 217, 192, 0.1)' : 'transparent',
                    borderLeft: i === selectedIndex ? '3px solid var(--accent-teal)' : '3px solid transparent',
                    color: i === selectedIndex ? 'var(--text-primary)' : 'var(--text-secondary)'
                  }}
                >
                  <item.icon size={16} color={i === selectedIndex ? 'var(--accent-teal)' : 'var(--text-muted)'} />
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: '14px' }}>{item.title}</span>
                </div>
              ))}
              {filtered.length === 0 && (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                  No commands found
                </div>
              )}
            </div>
            <div style={{ padding: '8px 16px', background: 'var(--bg-raised)', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: '16px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '10px' }}>
              <span><strong style={{ color: 'var(--text-primary)' }}>↑↓</strong> to navigate</span>
              <span><strong style={{ color: 'var(--text-primary)' }}>Enter</strong> to select</span>
            </div>
          </motion.div>
        </React.Fragment>
      )}
    </AnimatePresence>
  );
}
