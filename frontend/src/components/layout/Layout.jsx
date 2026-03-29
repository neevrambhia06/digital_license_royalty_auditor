import React from 'react';
import { Outlet } from 'react-router-dom';
import TopBar from './TopBar';

export default function Layout() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <TopBar />
      <main style={{
        marginTop: 'var(--topbar-height)',
        padding: '32px 40px',
        maxWidth: '1440px',
        width: '100%',
        margin: 'var(--topbar-height) auto 0 auto'
      }}>
        <Outlet />
      </main>
    </div>
  );
}
