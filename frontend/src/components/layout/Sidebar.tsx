import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, 
  FileText, 
  Database, 
  CreditCard, 
  Search, 
  AlertTriangle, 
  TerminalSquare, 
  ChevronLeft, 
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/dashboard', icon: Home },
  { label: 'Contracts', path: '/contracts', icon: FileText },
  { label: 'Logs', path: '/logs', icon: Database },
  { label: 'Payments', path: '/payments', icon: CreditCard },
  { label: 'Audit', path: '/audit', icon: Search },
  { label: 'Violations', path: '/violations', icon: AlertTriangle },
  { label: 'Agent Trace', path: '/trace', icon: TerminalSquare }
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className="app-sidebar" style={{
      width: collapsed ? '64px' : '240px',
      height: '100vh',
      background: 'rgba(13, 17, 23, 0.95)',
      backdropFilter: 'blur(12px)',
      borderRight: '1px solid var(--border-subtle)',
      display: 'flex',
      flexDirection: 'column',
      transition: 'width 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
      position: 'relative',
      zIndex: 100,
      flexShrink: 0
    }}>
      {/* Brand Header */}
      <div className="app-sidebar-brand" style={{
        padding: '24px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        borderBottom: '1px solid var(--border-subtle)',
        height: '73px', // Match topbar height
        boxSizing: 'border-box'
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          flexShrink: 0,
          borderRadius: '8px',
          background: 'linear-gradient(135deg, var(--accent-teal), rgba(0,217,192,0.2))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 15px rgba(0, 217, 192, 0.2)'
        }}>
          <ShieldCheck size={20} color="var(--bg-void)" />
        </div>
        {!collapsed && (
          <span style={{
            fontFamily: 'var(--font-heading)',
            fontWeight: 800,
            fontSize: '15px',
            letterSpacing: '0.04em',
            color: 'var(--text-primary)',
            whiteSpace: 'nowrap',
            opacity: collapsed ? 0 : 1,
            transition: 'opacity 0.2s',
            overflow: 'hidden'
          }}>
            DLRA.<span style={{ color: 'var(--accent-teal)' }}>SYS</span>
          </span>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="app-sidebar-nav" style={{ flex: 1, padding: '24px 0', overflowY: 'auto', overflowX: 'hidden' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }} className="app-sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              className={({ isActive }) => `app-sidebar-link ${isActive ? 'active' : ''}`}
              title={collapsed ? item.label : undefined}
              to={item.path}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                margin: '0 8px',
                borderRadius: '8px',
                color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                background: isActive ? 'rgba(0, 217, 192, 0.08)' : 'transparent',
                borderLeft: isActive ? '3px solid var(--border-glow)' : '3px solid transparent',
                textDecoration: 'none',
                transition: 'all 0.2s'
              })}
              onMouseOver={(e) => {
                if (!e.currentTarget.style.borderLeft.includes('var(--border-glow)')) {
                  e.currentTarget.style.color = 'var(--text-secondary)';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                }
              }}
              onMouseOut={(e) => {
                if (!e.currentTarget.style.borderLeft.includes('var(--border-glow)')) {
                  e.currentTarget.style.color = 'var(--text-muted)';
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              <item.icon size={20} style={{ flexShrink: 0, marginLeft: collapsed ? '4px' : '0', transition: 'margin 0.3s' }} color="currentColor" />
              {!collapsed && (
                <span className="hide-on-mobile" style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '13px',
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                  opacity: collapsed ? 0 : 1,
                  transition: 'opacity 0.2s'
                }}>
                  {item.label}
                </span>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Footer Toggle */}
      <div className="app-sidebar-toggle" style={{
        padding: '16px',
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'flex-end'
      }}>
        <button
          onClick={() => setCollapsed(!collapsed)}
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-muted)',
            width: '32px',
            height: '32px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseOver={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'var(--accent-teal)'; }}
          onMouseOut={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>
    </aside>
  );
}
