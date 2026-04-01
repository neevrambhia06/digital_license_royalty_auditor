import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import TopBar from './TopBar';
import ShortcutOverlay from './ShortcutOverlay';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';

export default function AppShell() {
  const location = useLocation();
  const [isRunning, setIsRunning] = React.useState(false);
  const [isShortcutOpen, setIsShortcutOpen] = React.useState(false);

  React.useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsShortcutOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, []);

  const handleRunAudit = () => {
    setIsRunning(true);
    toast.loading('Initializing Agentic Audit Pipeline...', { id: 'audit' });
    
    // Simulate audit run
    setTimeout(() => {
      setIsRunning(false);
      toast.success('Audit Complete: $52,340 Leakage Found', { id: 'audit' });
      
      // Celebration
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#06B6D4', '#22C55E', '#EF4444'], // Cyan, Green, Red
        scalar: 0.8
      });
    }, 3000);
  };

  return (
    <div className="app-shell" style={{ position: 'relative', width: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Centered Floating Navbar */}
      <TopBar onRun={handleRunAudit} isRunning={isRunning} disabled={false} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', width: '100%', paddingTop: '104px', paddingBottom: '48px', position: 'relative', zIndex: 5 }}>
        <main className="main-content" style={{ maxWidth: '1440px', width: '100%', margin: '0 auto', padding: '0 32px' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Global Command Palette */}
      <ShortcutOverlay isOpen={isShortcutOpen} onClose={() => setIsShortcutOpen(false)} />
    </div>
  );
}


