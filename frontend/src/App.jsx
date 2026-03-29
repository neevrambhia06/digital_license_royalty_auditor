import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppShell from './components/layout/AppShell';

import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';

import DashboardPage from './pages/DashboardPage';
import Contracts from './pages/Contracts';
import LogsPage from './pages/LogsPage';
import PaymentsPage from './pages/PaymentsPage';
import AuditPage from './pages/AuditPage';
import ViolationsPage from './pages/ViolationsPage';
import LeakageSummary from './pages/LeakageSummary';
import AgentTrace from './pages/AgentTrace';

import { Toaster } from 'react-hot-toast';
import CommandPalette from './components/CommandPalette';

import PageTransition from './components/layout/PageTransition';

function AppRoutes() {
  const location = useLocation();
  const topLevelPath = location.pathname.split('/')[1] || '';
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={topLevelPath === 'login' || topLevelPath === 'signup' ? topLevelPath : (topLevelPath === '' ? 'home' : 'app')}>
        <Route path="/" element={<PageTransition><LandingPage /></PageTransition>} />
        <Route path="/login" element={<PageTransition><AuthPage /></PageTransition>} />
        <Route path="/signup" element={<PageTransition><AuthPage isSignup /></PageTransition>} />
        
        {/* Protected Dashboard Routes */}
        <Route element={<PageTransition><ProtectedRoute /></PageTransition>}>
          <Route element={<AppShell />}>
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="contracts" element={<Contracts />} />
            <Route path="logs" element={<LogsPage />} />
            <Route path="payments" element={<PaymentsPage />} />
            <Route path="audit" element={<AuditPage />} />
            {/* Kept for backward compatibility if internally linked: */}
            <Route path="audit-results" element={<AuditPage />} />
            <Route path="violations" element={<ViolationsPage />} />
            <Route path="leakage-summary" element={<LeakageSummary />} />
            <Route path="trace" element={<AgentTrace />} />
            {/* Alias for backward compatibility relative to TopBar links: */}
            <Route path="agent-trace" element={<AgentTrace />} />
          </Route>
        </Route>
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Toaster 
        position="bottom-right"
        toastOptions={{
          className: '',
          style: {
            background: 'var(--bg-card)',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-mono)',
            fontSize: '14px',
            border: '1px solid var(--border-glow)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
          },
          success: {
            iconTheme: {
              primary: 'var(--success)',
              secondary: 'var(--bg-card)',
            },
          },
          error: {
            iconTheme: {
              primary: 'var(--danger)',
              secondary: 'var(--bg-card)',
            },
            style: {
              border: '1px solid var(--danger)',
            }
          }
        }}
      />
      <CommandPalette />
      <AppRoutes />
    </AuthProvider>
  );
}
