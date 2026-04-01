import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/' },
  { label: 'Contracts', path: '/contracts' },
  { label: 'Logs', path: '/logs' },
  { label: 'Payments', path: '/payments' },
  { label: 'Audit', path: '/audit-results' },
  { label: 'Violations', path: '/violations' },
  { label: 'Agent Trace', path: '/agent-trace' }
];

export default function TopBar({ onRun, isRunning, disabled }) {
  const location = useLocation();

  return (
    <header style={{
      position: 'fixed',
      top: '24px',
      left: '50%',
      transform: 'translateX(-50%)',
      height: '56px',
      zIndex: 100,
      background: 'rgba(7, 7, 15, 0.85)',
      backdropFilter: 'blur(16px) saturate(1.4)',
      WebkitBackdropFilter: 'blur(16px) saturate(1.4)',
      border: '1px solid rgba(232, 184, 75, 0.12)',
      borderBottom: '1px solid var(--gold-dim)',
      borderRadius: '28px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '0 8px 0 24px',
      boxShadow: '0 24px 48px -12px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
      gap: '32px'
    }}>
      {/* Left: Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.85 }}>
        <div style={{
          width: '20px',
          height: '20px',
          borderRadius: '4px',
          background: 'var(--status-agent)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'var(--font-heading)',
          fontWeight: 800,
          fontSize: '11px',
          color: 'var(--text-inverse)'
        }}>
          A
        </div>
        <span style={{
          fontFamily: 'var(--font-heading)',
          fontWeight: 600,
          fontSize: '13px',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--text-primary)'
        }}>
          AUDITIQ
        </span>
      </div>

      {/* Center: Navigation */}
      <nav style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
      }}>
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.path || (location.pathname === '/dashboard' && item.path === '/');
          return (
            <NavLink
              key={item.path}
              to={item.path}
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '13px',
                fontWeight: isActive ? 600 : 400,
                color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                textDecoration: 'none',
                padding: '8px 16px',
                borderRadius: '20px',
                background: isActive ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                border: isActive ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid transparent',
                backdropFilter: isActive ? 'blur(8px)' : 'none',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                position: 'relative',
                whiteSpace: 'nowrap',
                letterSpacing: '0.02em'
              }}
              onMouseOver={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = 'var(--text-primary)';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                }
              }}
              onMouseOut={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = 'var(--text-muted)';
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              {item.label}
              {isActive && (
                <div style={{
                  position: 'absolute',
                  bottom: '-4px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '24px',
                  height: '2px',
                  borderRadius: '1px',
                  background: 'var(--status-agent)',
                  boxShadow: '0 0 12px var(--status-agent)'
                }} />
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Right: Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          onClick={onRun}
          disabled={disabled || isRunning}
          style={{
            border: '1px solid rgba(6, 182, 212, 0.4)',
            background: isRunning ? 'var(--status-agent)' : 'rgba(6, 182, 212, 0.05)',
            color: isRunning ? 'var(--text-inverse)' : 'var(--status-agent)',
            fontFamily: 'var(--font-heading)',
            fontWeight: 600,
            fontSize: '12px',
            padding: '8px 20px',
            borderRadius: '20px',
            cursor: (disabled || isRunning) ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            opacity: disabled ? 0.4 : 1,
            boxShadow: isRunning ? '0 0 20px rgba(6, 182, 212, 0.4)' : 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}
          onMouseOver={(e) => {
            if (!disabled && !isRunning) {
              e.currentTarget.style.background = 'var(--status-agent)';
              e.currentTarget.style.color = 'var(--text-inverse)';
              e.currentTarget.style.boxShadow = '0 0 20px rgba(6, 182, 212, 0.4)';
              e.currentTarget.style.borderColor = 'var(--status-agent)';
            }
          }}
          onMouseOut={(e) => {
            if (!disabled && !isRunning) {
              e.currentTarget.style.background = 'rgba(6, 182, 212, 0.05)';
              e.currentTarget.style.color = 'var(--status-agent)';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.4)';
            }
          }}
        >
          {isRunning && <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />}
          {isRunning ? 'Auditing...' : 'Run Audit'}
        </button>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </header>
  );
}
