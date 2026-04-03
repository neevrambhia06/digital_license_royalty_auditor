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
    <header className="nav-capsule">
      {/* Left: Brand - Use flex: 1 to help centering, but allow shrinking */}
      <div className="brand-section" style={{ flex: '1 1 0', minWidth: 'fit-content' }}>
        <div className="brand-box">A</div>
        <span className="brand-name">AUDITIQ</span>
      </div>

      {/* Center: Links - Prevent shrinking entirely */}
      <nav className="nav-container" style={{ flex: '0 0 auto' }}>
        <NavLink 
          to="/dashboard" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          Dashboard
        </NavLink>
        <NavLink 
          to="/contracts" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          Contracts
        </NavLink>
        <NavLink 
          to="/logs" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          Logs
        </NavLink>
        <NavLink 
          to="/payments" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          Payments
        </NavLink>
        <NavLink 
          to="/audit" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          Audit
        </NavLink>
        <NavLink 
          to="/violations" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          Violations
        </NavLink>
        <NavLink 
          to="/agent-trace" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          Agent Trace
        </NavLink>
      </nav>

      {/* Right: Actions - Use flex: 1 to balance centering */}
      <div style={{ flex: '1 1 0', display: 'flex', justifyContent: 'flex-end', height: '100%', minWidth: 'fit-content' }}>
        <button 
          className="audit-trigger" 
          onClick={onRun}
          disabled={disabled || isRunning}
        >
          {isRunning && <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />}
          {isRunning ? 'Auditing' : 'RUN AUDIT'}
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
