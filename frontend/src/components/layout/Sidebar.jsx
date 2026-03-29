import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  Activity, 
  CreditCard, 
  Search, 
  AlertTriangle, 
  TrendingDown, 
  GitBranch 
} from 'lucide-react';

const SECTIONS = [
  {
    title: 'OVERVIEW',
    items: [
      { label: 'Dashboard', icon: LayoutDashboard, path: '/' }
    ]
  },
  {
    title: 'DATA',
    items: [
      { label: 'Contracts', icon: FileText, path: '/contracts' },
      { label: 'Streaming Logs', icon: Activity, path: '/logs' },
      { label: 'Payments', icon: CreditCard, path: '/payments' }
    ]
  },
  {
    title: 'AUDIT',
    items: [
      { label: 'Audit Results', icon: Search, path: '/audit' },
      { label: 'Violations', icon: AlertTriangle, path: '/violations' },
      { label: 'Leakage Summary', icon: TrendingDown, path: '/leakage-summary' }
    ]
  },
  {
    title: 'SYSTEM',
    items: [
      { label: 'Agent Trace', icon: GitBranch, path: '/agent-trace' }
    ]
  }
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside style={{
      position: 'fixed',
      top: 'var(--topbar-height)',
      left: 0,
      bottom: 0,
      width: '220px',
      zIndex: 50,
      background: 'var(--bg-base)',
      borderRight: '1px solid var(--border-subtle)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{ flex: 1, overflowY: 'auto', paddingTop: '8px' }}>
        {SECTIONS.map((section, idx) => (
          <div key={idx} style={{ marginBottom: '8px' }}>
            <div style={{
              fontFamily: 'var(--font-body)',
              fontSize: '10px',
              fontWeight: 700,
              letterSpacing: '0.15em',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              padding: '16px 20px 6px'
            }}>
              {section.title}
            </div>
            {section.items.map((item, itemIdx) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              
              return (
                <NavLink 
                  key={itemIdx} 
                  to={item.path}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 20px',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-body)',
                    fontSize: '13px',
                    fontWeight: 500,
                    color: isActive ? 'var(--accent-teal)' : 'var(--text-secondary)',
                    transition: 'all 0.15s',
                    textDecoration: 'none',
                    position: 'relative',
                    background: isActive ? 'rgba(0,217,192,0.06)' : 'transparent'
                  }}
                  onMouseOver={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'var(--bg-raised)';
                      e.currentTarget.style.color = 'var(--text-primary)';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = 'var(--text-secondary)';
                    }
                  }}
                >
                  {isActive && (
                    <div style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: '3px',
                      background: 'var(--accent-teal)',
                      boxShadow: '0 0 8px rgba(0,217,192,0.4)'
                    }} />
                  )}
                  <Icon size={16} color="inherit" />
                  {item.label}
                </NavLink>
              );
            })}
          </div>
        ))}
      </div>
      
      <div style={{
        padding: '16px 20px',
        borderTop: '1px solid var(--border-subtle)'
      }}>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '10px',
          color: 'var(--text-muted)',
          border: '1px solid var(--border-subtle)',
          padding: '2px 8px',
          borderRadius: 'var(--radius-sm)',
          display: 'inline-block'
        }}>
          DEMO MODE
        </div>
      </div>
    </aside>
  );
}
