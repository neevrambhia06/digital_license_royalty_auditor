import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ShieldCheck, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Card from '../components/ui/Card';

export default function AuthPage({ isSignup = false }: { isSignup?: boolean }) {
  const navigate = useNavigate();
  const { loginAsGuest } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Auto-login as guest for the demo
      loginAsGuest();
      navigate('/dashboard');
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-void)',
      backgroundSize: '40px 40px',
      backgroundImage: 'linear-gradient(rgba(0, 217, 192, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 217, 192, 0.03) 1px, transparent 1px)',
      position: 'relative'
    }}>
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '800px',
        height: '800px',
        background: 'radial-gradient(circle, rgba(0,217,192,0.05) 0%, transparent 60%)',
        pointerEvents: 'none'
      }} />

      {/* Back to Home Link */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        style={{
          position: 'absolute',
          top: '40px',
          left: '40px',
          zIndex: 10
        }}
      >
        <Link 
          to="/" 
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: 'var(--text-muted)',
            textDecoration: 'none',
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            fontWeight: 600,
            transition: 'all 0.2s',
            letterSpacing: '0.05em'
          }}
          onMouseOver={e => e.currentTarget.style.color = 'var(--accent-teal)'}
          onMouseOut={e => e.currentTarget.style.color = 'var(--text-muted)'}
        >
          <ArrowLeft size={14} /> BACK TO HOME
        </Link>
      </motion.div>

      <motion.div
        key={isSignup ? 'signup' : 'login'}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* @ts-ignore */}
        <Card style={{
          width: '400px',
          padding: '40px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          backdropFilter: 'blur(10px)',
          background: 'rgba(25, 34, 46, 0.8)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.05)'
        }}>
          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, var(--accent-teal), rgba(0,217,192,0.2))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 15px rgba(0, 217, 192, 0.3)'
            }}>
              <ShieldCheck size={24} color="var(--bg-void)" />
            </div>
            <h1 style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '24px',
              fontWeight: 800,
              color: 'var(--text-primary)',
              letterSpacing: '0.05em',
              margin: 0
            }}>
              AuditIQ
            </h1>
          </div>

          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: '14px',
            color: 'var(--text-secondary)',
            marginBottom: '32px',
            textAlign: 'center'
          }}>
            {isSignup ? 'Create an auditor account to begin tracing leakages.' : 'Secure terminal access to the auditor engine.'}
          </p>

          <AnimatePresence>
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{
                  width: '100%',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid var(--danger)',
                  color: 'var(--danger)',
                  padding: '12px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '12px',
                  fontFamily: 'var(--font-mono)',
                  marginBottom: '20px',
                  textAlign: 'center'
                }}
              >
                {errorMsg}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleAuth} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px' }}>LOGIN ID</label>
              <input 
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
                required
                placeholder="auditor@studio.com"
                style={{
                  width: '100%',
                  background: 'var(--bg-base)',
                  border: '1px solid var(--border-subtle)',
                  padding: '12px 16px',
                  borderRadius: '4px',
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '13px',
                  outline: 'none',
                  transition: 'border 0.2s, box-shadow 0.2s'
                }}
                onFocus={e => { e.currentTarget.style.borderColor = 'var(--accent-teal)'; e.currentTarget.style.boxShadow = '0 0 0 1px var(--accent-teal)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.boxShadow = 'none'; }}
              />
            </div>

            <div style={{ marginBottom: '8px' }}>
              <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px' }}>PASSWORD</label>
              <input 
                type="password"
                value={password}
                required
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••••••"
                style={{
                  width: '100%',
                  background: 'var(--bg-base)',
                  border: '1px solid var(--border-subtle)',
                  padding: '12px 16px',
                  borderRadius: '4px',
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '13px',
                  outline: 'none',
                  transition: 'border 0.2s, box-shadow 0.2s'
                }}
                onFocus={e => { e.currentTarget.style.borderColor = 'var(--accent-teal)'; e.currentTarget.style.boxShadow = '0 0 0 1px var(--accent-teal)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.boxShadow = 'none'; }}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !email || !password}
              style={{
                width: '100%',
                background: 'var(--accent-teal)',
                color: 'var(--bg-void)',
                border: 'none',
                padding: '14px',
                borderRadius: '4px',
                fontFamily: 'var(--font-heading)',
                fontWeight: 700,
                fontSize: '14px',
                cursor: isLoading ? 'wait' : 'pointer',
                opacity: (isLoading || !email || !password) ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s'
              }}
              onMouseOver={e => {
                if (!isLoading && email && password) {
                  e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 217, 192, 0.4)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }
              }}
              onMouseOut={e => {
                if (!isLoading) {
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.transform = 'translateY(0)';
                }
              }}
            >
              {isLoading ? <Loader2 size={16} style={{ animation: 'spin 1.5s linear infinite' }} /> : (isSignup ? 'INITIALIZE ACCOUNT' : 'AUTHENTICATE SESSION')}
            </button>
          </form>

          <div style={{ marginTop: '24px', fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--text-muted)' }}>
            {isSignup ? (
              <>Already hold clearance? <Link to="/login" style={{ color: 'var(--text-primary)', textDecoration: 'underline', textDecorationColor: 'var(--accent-teal)', textUnderlineOffset: '4px', fontWeight: 600 }}>Sign in</Link></>
            ) : (
              <>Require auditing access? <Link to="/signup" style={{ color: 'var(--text-primary)', textDecoration: 'underline', textDecorationColor: 'var(--accent-teal)', textUnderlineOffset: '4px', fontWeight: 600 }}>Register operator</Link></>
            )}
          </div>

          <button
            onClick={() => {
              loginAsGuest();
              navigate('/dashboard');
            }}
            style={{
              marginTop: '16px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px dashed var(--border-subtle)',
              color: 'var(--text-secondary)',
              padding: '8px 20px',
              borderRadius: '4px',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              width: '100%'
            }}
            onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
            onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
          >
            [ EMERGENCY OVERRIDE ] ENTER AS GUEST
          </button>

        </Card>
      </motion.div>
    </div>
  );
}
