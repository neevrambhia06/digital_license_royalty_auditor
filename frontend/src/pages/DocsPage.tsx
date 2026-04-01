import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Book, 
  Cpu, 
  Shield, 
  Zap, 
  ArrowLeft,
  FileCode,
  Lock
} from 'lucide-react';

const DOC_SECTIONS = [
  { id: 'intro', title: 'Introduction', icon: Book },
  { id: 'arch', title: 'Architecture', icon: Cpu },
  { id: 'security', title: 'Security & Compliance', icon: Shield },
  { id: 'api', title: 'API Reference', icon: FileCode }
];

export default function DocsPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-void)',
      color: 'var(--text-primary)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Top Navbar */}
      <nav style={{
        height: '72px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 40px',
        background: 'rgba(8, 11, 15, 0.8)',
        backdropFilter: 'blur(12px)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <Link to="/" style={{ color: 'var(--text-muted)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontFamily: 'var(--font-mono)' }}>
            <ArrowLeft size={16} /> BACK TO SITE
          </Link>
          <div style={{ width: '1px', height: '20px', background: 'var(--border-subtle)' }} />
          <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '18px', letterSpacing: '0.04em' }}>
            AuditIQ.<span style={{ color: 'var(--accent-teal)' }}>DOCS</span>
          </span>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <Link to="/login" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '14px' }}>Support</Link>
          <Link to="/signup" style={{ color: 'var(--accent-teal)', textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}>Get Started</Link>
        </div>
      </nav>

      <div style={{ display: 'flex', flex: 1, maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
        {/* Sidebar */}
        <aside style={{
          width: '280px',
          borderRight: '1px solid var(--border-subtle)',
          padding: '40px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          position: 'sticky',
          top: '72px',
          height: 'calc(100vh - 72px)'
        }}>
          {DOC_SECTIONS.map(section => (
            <button key={section.id} style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '12px 16px', borderRadius: '8px',
              background: section.id === 'intro' ? 'rgba(0, 217, 192, 0.08)' : 'transparent',
              border: 'none', color: section.id === 'intro' ? 'var(--text-primary)' : 'var(--text-muted)',
              textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s',
              fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 500
            }}
            onMouseOver={e => { if(section.id !== 'intro') e.currentTarget.style.color = 'var(--text-secondary)'; }}
            onMouseOut={e => { if(section.id !== 'intro') e.currentTarget.style.color = 'var(--text-muted)'; }}
            >
              <section.icon size={18} color={section.id === 'intro' ? 'var(--accent-teal)' : 'currentColor'} />
              {section.title}
            </button>
          ))}
        </aside>

        {/* Content */}
        <main style={{ flex: 1, padding: '64px 80px', maxWidth: '900px' }}>
          <section id="intro">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <span style={{ color: 'var(--accent-teal)', fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 600, letterSpacing: '0.1em' }}>DOCUMENTATION / V0.1.0</span>
              <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '48px', marginTop: '16px', marginBottom: '24px' }}>Introduction</h1>
              <p style={{ fontSize: '18px', lineHeight: 1.6, color: 'var(--text-secondary)', marginBottom: '40px' }}>
                The AuditIQ (AuditIQ) is an agentic AI system designed to reconcile streaming log data against complex legal contracts. 
                It identifies revenue leakage, territory violations, and expiry discrepancies automatically.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '64px' }}>
                <div style={{ padding: '24px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '12px' }}>
                  <Zap size={24} color="var(--accent-teal)" style={{ marginBottom: '16px' }} />
                  <h3 style={{ fontSize: '18px', marginBottom: '12px' }}>High Performance</h3>
                  <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.5 }}>Aggregates millions of streaming events across thousands of titles in under 5 seconds.</p>
                </div>
                <div style={{ padding: '24px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '12px' }}>
                  <Lock size={24} color="var(--accent-teal)" style={{ marginBottom: '16px' }} />
                  <h3 style={{ fontSize: '18px', marginBottom: '12px' }}>Secure Ingestion</h3>
                  <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.5 }}>Enterprise-grade encryption for sensitive legal agreements and PII-free streaming logs.</p>
                </div>
              </div>

              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '28px', marginBottom: '20px' }}>Core Concepts</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                <div>
                  <h4 style={{ color: 'var(--accent-teal)', marginBottom: '8px' }}>The Audit Cycle</h4>
                  <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>An audit cycle consists of three phases: Ingestion, Reconciliation, and Verification. The engine reads unstructured legal terms and compares them with real-world consumption patterns.</p>
                </div>
                <div style={{ padding: '24px', background: 'var(--bg-raised)', border: '1px solid var(--border-subtle)', borderRadius: '8px', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
                  <div style={{ color: 'var(--text-muted)' }}>// Example API request to trigger audit</div>
                  <div style={{ color: 'var(--accent-teal)', marginTop: '8px' }}>POST /api/audit/run</div>
                  <div style={{ color: 'var(--text-primary)' }}>{`{
  "contracts": ["lion_gate_main_2026.pdf"],
  "logs": "streaming_logs_latest.csv",
  "territories": ["global"]
}`}</div>
                </div>
              </div>
            </motion.div>
          </section>
        </main>
      </div>
    </div>
  );
}
