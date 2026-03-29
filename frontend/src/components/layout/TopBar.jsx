import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/' },
  { label: 'Contracts', path: '/contracts' },
  { label: 'Logs', path: '/logs' },
  { label: 'Payments', path: '/payments' },
  { label: 'Results', path: '/audit-results' },
  { label: 'Violations', path: '/violations' },
  { label: 'Leakage', path: '/leakage-summary' },
  { label: 'Trace', path: '/agent-trace' }
];

export default function TopBar({ onRun, isRunning, disabled }) {
  const location = useLocation();

  return (
    <header style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: 'var(--topbar-height)',
      zIndex: 100,
      background: 'rgba(13, 17, 23, 0.85)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border-subtle)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px'
    }}>
      {/* Left: Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0, minWidth: '200px' }}>
        <div style={{
          width: '28px',
          height: '28px',
          borderRadius: 'var(--radius-sm)',
          background: 'linear-gradient(135deg, var(--accent-teal), rgba(0,217,192,0.3))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'var(--font-heading)',
          fontWeight: 800,
          fontSize: '14px',
          color: 'var(--bg-void)'
        }}>
          R
        </div>
        <span style={{
          fontFamily: 'var(--font-heading)',
          fontWeight: 700,
          fontSize: '14px',
          letterSpacing: '0.06em',
          color: 'var(--text-primary)'
        }}>
          ROYALTY AUDITOR
        </span>
      </div>

      {/* Center: Navigation */}
      <nav style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        position: 'absolute',
        left: '50%',
        transform: 'translateX(-50%)',
        height: '100%'
      }}>
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '13px',
                fontWeight: isActive ? 600 : 400,
                color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                textDecoration: 'none',
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                background: isActive ? 'var(--bg-raised)' : 'transparent',
                transition: 'all 0.15s ease',
                position: 'relative',
                whiteSpace: 'nowrap'
              }}
              onMouseOver={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = 'var(--text-secondary)';
                  e.currentTarget.style.background = 'var(--bg-raised)';
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
                  bottom: '-9px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '16px',
                  height: '2px',
                  borderRadius: '1px',
                  background: 'var(--accent-teal)',
                  boxShadow: '0 0 8px var(--accent-teal)'
                }} />
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Right: Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px', flexShrink: 0, minWidth: '200px' }}>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          color: 'var(--text-muted)',
          padding: '4px 8px',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-sm)',
          letterSpacing: '0.02em'
        }}>
          v0.1.0
        </div>
        <button
          onClick={onRun}
          disabled={disabled || isRunning}
          style={{
            border: '1px solid var(--accent-teal)',
            background: isRunning ? 'var(--accent-teal)' : 'transparent',
            color: isRunning ? 'var(--bg-void)' : 'var(--accent-teal)',
            fontFamily: 'var(--font-body)',
            fontWeight: 600,
            fontSize: '12px',
            padding: '6px 16px',
            borderRadius: 'var(--radius-sm)',
            cursor: (disabled || isRunning) ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s ease',
            opacity: disabled ? 0.4 : 1,
            boxShadow: isRunning ? '0 0 20px rgba(0,217,192,0.3)' : 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
          onMouseOver={(e) => {
            if (!disabled && !isRunning) {
              e.currentTarget.style.background = 'var(--accent-teal)';
              e.currentTarget.style.color = 'var(--bg-void)';
              e.currentTarget.style.boxShadow = '0 0 20px rgba(0,217,192,0.3)';
            }
          }}
          onMouseOut={(e) => {
            if (!disabled && !isRunning) {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--accent-teal)';
              e.currentTarget.style.boxShadow = 'none';
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
