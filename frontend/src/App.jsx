import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider } from './contexts/AuthContext';
import AppShell from './components/layout/AppShell';
import DashboardPage from './pages/DashboardPage';
import Contracts from './pages/Contracts';
import LogsPage from './pages/LogsPage';
import PaymentsPage from './pages/PaymentsPage';
import AuditPage from './pages/AuditPage';
import ViolationsPage from './pages/ViolationsPage';
import LeakageSummary from './pages/LeakageSummary';
import AgentTrace from './pages/AgentTrace';
import { Toaster } from 'react-hot-toast';

function AppRoutes() {
  const location = useLocation();
  const topLevelPath = location.pathname.split('/')[1] || 'dashboard';
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={topLevelPath}>
        <Route element={<AppShell />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/contracts" element={<Contracts />} />
          <Route path="/logs" element={<LogsPage />} />
          <Route path="/payments" element={<PaymentsPage />} />
          <Route path="/audit-results" element={<AuditPage />} />
          <Route path="/audit" element={<AuditPage />} />
          <Route path="/violations" element={<ViolationsPage />} />
          <Route path="/leakage-summary" element={<LeakageSummary />} />
          <Route path="/agent-trace" element={<AgentTrace />} />
          <Route path="/trace" element={<AgentTrace />} />
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
          style: {
            background: 'var(--bg-elevated)',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-ui)',
            fontSize: '13px',
            border: '1px solid var(--gold-dim)',
            borderRadius: 'var(--radius-sm)',
            padding: '12px 16px',
            maxWidth: '380px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
          },
          success: {
            style: { borderLeft: '3px solid var(--cyan-bright)' }
          },
          error: {
            style: { borderLeft: '3px solid var(--crimson-hot)' }
          }
        }}
      />
      <AppRoutes />
    </AuthProvider>
  );
}
