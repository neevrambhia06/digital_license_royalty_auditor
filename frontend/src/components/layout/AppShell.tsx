import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import Sidebar from './Sidebar';
import { LogOut, User } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import PageTransition from './PageTransition';

export default function AppShell() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  // Generate breadcrumb from path
  const pathParts = location.pathname.split('/').filter(Boolean);
  const breadcrumb = pathParts.length > 0 
    ? pathParts[pathParts.length - 1].charAt(0).toUpperCase() + pathParts[pathParts.length - 1].slice(1)
    : 'Dashboard';

  return (
    <div className="app-layout" style={{ display: 'flex', width: '100vw', height: '100vh', background: 'var(--bg-void)' }}>
      <Sidebar />
      
      <div className="app-main-container" style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, position: 'relative' }}>
        {/* Top Header */}
        <header className="app-header" style={{
          height: '73px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 32px',
          background: 'rgba(13, 17, 23, 0.95)',
          backdropFilter: 'blur(12px)',
          position: 'sticky',
          top: 0,
          zIndex: 50
        }}>
          {/* Breadcrumbs */}
          <div className="app-header-items" style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '18px',
            fontWeight: 700,
            color: 'var(--text-primary)',
            letterSpacing: '0.02em',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{ color: 'var(--accent-teal)' }}>/</span>
            {breadcrumb.replace('-', ' ')}
          </div>

          {/* User Menu */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div className="hide-on-mobile" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '20px',
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              color: 'var(--text-muted)'
            }}>
              <User size={14} color="var(--accent-teal)" />
              {user?.email || 'auditor@system.local'}
            </div>
            
            <button
              onClick={handleSignOut}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'transparent',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseOver={e => { e.currentTarget.style.color = 'var(--danger)'; e.currentTarget.style.borderColor = 'var(--danger)'; e.currentTarget.style.background = 'rgba(239, 68, 68, 0.05)'; }}
              onMouseOut={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.background = 'transparent'; }}
              title="Terminate Session"
            >
              <LogOut size={14} />
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="app-main-view" style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '32px', position: 'relative' }}>
          {/* Subtle grid background for the main area to maintain the aesthetic */}
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundSize: '40px 40px',
            backgroundImage: 'linear-gradient(rgba(0, 217, 192, 0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 217, 192, 0.02) 1px, transparent 1px)',
            pointerEvents: 'none',
            zIndex: 0
          }} />
          <div style={{ position: 'relative', zIndex: 1, height: '100%' }}>
            <AnimatePresence mode="popLayout">
              <PageTransition key={location.pathname}>
                <Outlet />
              </PageTransition>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}
