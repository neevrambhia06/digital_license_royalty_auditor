import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export default function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ height: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-void)' }}>
        <Loader2 size={32} color="var(--accent-teal)" style={{ animation: 'spin 1.5s linear infinite' }} />
      </div>
    );
  }

  // If no user is logged in, redirect to auth form
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Render child routes (i.e. AppShell)
  return <Outlet />;
}
