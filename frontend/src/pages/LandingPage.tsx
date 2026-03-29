import React from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, 
  ChevronRight, 
  Terminal, 
  FileSearch, 
  Zap, 
  Globe, 
  CheckCircle2,
  FileJson,
  LayoutDashboard
} from 'lucide-react';

// Animation variants
const staggerContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }
};

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-void)',
      color: 'var(--text-primary)',
      overflowX: 'hidden'
    }}>
      {/* Global Background Grid */}
      <div style={{
        position: 'fixed',
        inset: 0,
        backgroundSize: '40px 40px',
        backgroundImage: 'linear-gradient(rgba(0, 217, 192, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 217, 192, 0.03) 1px, transparent 1px)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      {/* Navigation Bar */}
      <nav style={{
        position: 'fixed',
        top: 0, left: 0, right: 0,
        height: '72px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 40px',
        background: 'rgba(8, 11, 15, 0.8)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border-subtle)',
        zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '8px',
            background: 'linear-gradient(135deg, var(--accent-teal), rgba(0,217,192,0.2))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 15px rgba(0, 217, 192, 0.3)'
          }}>
            <ShieldCheck size={20} color="var(--bg-void)" />
          </div>
          <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '20px', letterSpacing: '0.05em' }}>
            DLRA
          </span>
        </div>
        
        <div style={{ display: 'flex', gap: '32px', fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--text-secondary)' }}>
          <a href="#features" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }} onMouseOver={e=>e.currentTarget.style.color='var(--text-primary)'} onMouseOut={e=>e.currentTarget.style.color='var(--text-secondary)'}>Features</a>
          <a href="#how-it-works" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }} onMouseOver={e=>e.currentTarget.style.color='var(--text-primary)'} onMouseOut={e=>e.currentTarget.style.color='var(--text-secondary)'}>Demo</a>
          <span style={{ cursor: 'not-allowed', opacity: 0.5 }}>Docs</span>
        </div>

        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <Link to="/login" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600, textDecoration: 'none' }}>
            Sign In
          </Link>
          <Link to="/signup" style={{
            background: 'rgba(0, 217, 192, 0.1)',
            color: 'var(--accent-teal)',
            border: '1px solid var(--border-glow)',
            padding: '8px 16px',
            borderRadius: '4px',
            fontFamily: 'var(--font-mono)',
            fontSize: '13px',
            fontWeight: 600,
            textDecoration: 'none',
            transition: 'all 0.2s'
          }}
          onMouseOver={e => { e.currentTarget.style.background = 'var(--accent-teal)'; e.currentTarget.style.color = 'var(--bg-void)'; e.currentTarget.style.boxShadow = '0 0 20px rgba(0,217,192,0.4)'; }}
          onMouseOut={e => { e.currentTarget.style.background = 'rgba(0, 217, 192, 0.1)'; e.currentTarget.style.color = 'var(--accent-teal)'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            Start Free
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{
        position: 'relative',
        paddingTop: '160px',
        paddingBottom: '100px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        zIndex: 10
      }}>
        {/* Radial Teal Burst */}
        <div style={{
          position: 'absolute',
          top: '20%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '80vw',
          height: '80vw',
          maxWidth: '1000px',
          maxHeight: '1000px',
          background: 'radial-gradient(circle, rgba(0,217,192,0.08) 0%, transparent 55%)',
          pointerEvents: 'none',
          zIndex: -1
        }} />

        <motion.div variants={staggerContainer} initial="hidden" animate="show" style={{ maxWidth: '900px', padding: '0 24px' }}>
          <motion.div variants={fadeUp} style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px', 
            padding: '6px 12px', borderRadius: '20px', 
            border: '1px solid var(--accent-teal)', 
            background: 'rgba(0,217,192,0.05)',
            color: 'var(--accent-teal)', fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 600,
            marginBottom: '32px'
          }}>
            <Search size={14} /> AI-Powered Audit Engine
          </motion.div>
          
          <motion.h1 variants={fadeUp} style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 'clamp(48px, 6vw, 84px)',
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
            marginBottom: '24px',
            color: 'var(--text-primary)'
          }}>
            Audit 1,000 Contracts.<br/>
            <span style={{ color: 'var(--accent-teal)' }}>Find $52K in 3 Seconds.</span>
          </motion.h1>

          <motion.p variants={fadeUp} style={{
            fontFamily: 'var(--font-body)',
            fontSize: '20px',
            color: 'var(--text-secondary)',
            maxWidth: '700px',
            margin: '0 auto 48px',
            lineHeight: 1.5
          }}>
            The Digital License Royalty Auditor detects underpayments, territory violations, and expired license usage — automatically.
          </motion.p>

          <motion.div variants={fadeUp} style={{ display: 'flex', gap: '20px', justifyContent: 'center', alignItems: 'center' }}>
            <button onClick={() => navigate('/signup')} style={{
              background: 'var(--accent-teal)', color: 'var(--bg-void)',
              fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '16px',
              padding: '16px 32px', borderRadius: '4px', border: 'none',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
              transition: 'all 0.2s'
            }}
            onMouseOver={e => { e.currentTarget.style.boxShadow = '0 0 30px rgba(0,217,192,0.4)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseOut={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              Run Demo Audit <ChevronRight size={18} />
            </button>
            <button onClick={() => window.scrollTo({ top: document.getElementById('how-it-works')?.offsetTop, behavior: 'smooth' })} style={{
              background: 'transparent', color: 'var(--text-primary)',
              fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '16px',
              padding: '16px 32px', borderRadius: '4px', border: '1px solid var(--border-subtle)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
              transition: 'all 0.2s'
            }}
            onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--accent-teal)'; e.currentTarget.style.color = 'var(--accent-teal)'; }}
            onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
            >
              View Architecture
            </button>
          </motion.div>

          <motion.p variants={fadeUp} style={{
            marginTop: '40px',
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
            color: 'var(--text-muted)',
            letterSpacing: '0.05em',
            textTransform: 'uppercase'
          }}>
            Used by streaming platforms, media companies, and RevOps teams
          </motion.p>
        </motion.div>

        {/* Hero Visual: Floating Terminal Mockup */}
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          style={{
            marginTop: '80px',
            width: '100%',
            maxWidth: '1000px',
            perspective: '1000px',
            padding: '0 24px'
          }}
        >
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '12px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 40px rgba(0,217,192,0.1)',
            overflow: 'hidden',
            animation: 'float 6s ease-in-out infinite'
          }}>
            {/* Window chrome */}
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-raised)' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--danger)' }} />
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--accent-amber)' }} />
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--success)' }} />
              <span style={{ marginLeft: '12px', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-muted)' }}>auditor-engine ~ ./bin/trace</span>
            </div>
            {/* Terminal body */}
            <div style={{ padding: '24px', fontFamily: 'var(--font-mono)', fontSize: '13px', lineHeight: 1.6, textAlign: 'left' }}>
              <div style={{ color: 'var(--text-secondary)' }}>[14:02:11.401] <span style={{ color: 'var(--accent-teal)' }}>[ContractReader]</span> Ingested 1,000 PDF agreements</div>
              <div style={{ color: 'var(--text-secondary)' }}>[14:02:12.832] <span style={{ color: 'var(--accent-purple)' }}>[StreamIngester]</span> Aggregated 14.2M streaming logs</div>
              <div style={{ color: 'var(--text-secondary)' }}>[14:02:13.109] <span style={{ color: 'var(--warning)' }}>[TerritoryAgent]</span> Flagged 842 plays in unauthorized regions</div>
              <div style={{ color: 'var(--text-secondary)' }}>[14:02:14.500] <span style={{ color: 'var(--danger)' }}>[LedgerAgent]</span> Discrepancy found. Expected: $94,200. Paid: $41,860.</div>
              <div style={{ 
                marginTop: '16px', padding: '12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px dashed var(--danger)', 
                color: 'var(--danger)', fontWeight: 'bold' 
              }}>
                &gt; CRITICAL: $52,340 Leakage Detected across 8 contracts.
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Demo Narrative Pitch */}
      <section id="how-it-works" style={{ padding: '100px 24px', background: 'var(--bg-raised)', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)', position: 'relative', zIndex: 10 }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '32px', textAlign: 'center', marginBottom: '64px', color: 'var(--text-primary)' }}>
            Humans can't audit 1,000 contracts manually. <span style={{ color: 'var(--accent-teal)' }}>AI can.</span>
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '80px' }}>
            {[
              { icon: FileSearch, title: 'Load Contracts', desc: '1,000 contracts. 500 pages each. Ingested in seconds.' },
              { icon: Zap, title: 'Compare & Calculate', desc: 'Every play × every rate × every territory rule. Automatically.' },
              { icon: AlertTriangle, title: 'Find Leakage', desc: 'Underpayments, violations, expired licenses. Flagged instantly.' }
            ].map((step, i) => (
              <div key={i} style={{
                background: 'var(--bg-card)', padding: '32px', borderRadius: '12px', border: '1px solid var(--border-subtle)',
                transition: 'all 0.3s ease', cursor: 'default'
              }}
              onMouseOver={e=>{ e.currentTarget.style.borderColor='var(--accent-teal)'; e.currentTarget.style.transform='translateY(-4px)'; }}
              onMouseOut={e=>{ e.currentTarget.style.borderColor='var(--border-subtle)'; e.currentTarget.style.transform='translateY(0)'; }}
              >
                <step.icon size={32} color="var(--accent-teal)" style={{ marginBottom: '24px' }} />
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '20px', marginBottom: '12px' }}>{step.title}</h3>
                <p style={{ fontFamily: 'var(--font-body)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{step.desc}</p>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', padding: '40px 0', borderTop: '1px dashed var(--border-subtle)' }}>
            <p style={{ fontFamily: 'var(--font-heading)', fontSize: '28px', fontStyle: 'italic', fontWeight: 600, color: 'var(--text-primary)', maxWidth: '800px', margin: '0 auto', lineHeight: 1.4 }}>
              "We audited 1,000 contracts in 3 seconds and found <span style={{ color: 'var(--accent-teal)' }}>$52,340 in royalty leakage.</span>"
            </p>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" style={{ padding: '120px 24px', position: 'relative', zIndex: 10 }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '120px' }}>
          
          {/* Feature 1 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '60px', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 400px' }}>
              <div style={{ color: 'var(--accent-teal)', fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 600, marginBottom: '16px' }}>01 / PIPELINE</div>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '36px', marginBottom: '24px' }}>Contract Reader Agent</h3>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '18px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>Parses legal contracts and extracts rate, territory, expiry, and tier rules — no human review needed. Transforms unstructured PDFs into structured intelligence.</p>
            </div>
            <div style={{ flex: '1 1 500px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '32px', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ color: 'var(--text-muted)' }}>Found entity: <span style={{ color: 'var(--text-primary)' }}>Lionsgate Cinema</span></div>
                <div style={{ color: 'var(--text-muted)' }}>Rule matched:</div>
                <div style={{ padding: '12px', background: 'rgba(0,217,192,0.1)', borderLeft: '2px solid var(--accent-teal)', color: 'var(--accent-teal)' }}>
                  Tier 1: 30% royalty below 500k plays<br/>
                  Tier 2: 45% royalty above 500k plays
                </div>
              </div>
            </div>
          </div>

          {/* Feature 2 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '60px', flexWrap: 'wrap-reverse' }}>
            <div style={{ flex: '1 1 500px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1px', background: 'var(--border-subtle)' }}>
                <div style={{ padding: '12px 16px', background: 'var(--bg-raised)', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-muted)' }}>Title</div>
                <div style={{ padding: '12px 16px', background: 'var(--bg-raised)', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-muted)' }}>Expected</div>
                <div style={{ padding: '12px 16px', background: 'var(--bg-raised)', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-muted)' }}>Delta</div>
                <div style={{ padding: '16px', background: 'var(--bg-card)', fontSize: '14px' }}>John Wick 4</div>
                <div style={{ padding: '16px', background: 'var(--bg-card)', fontFamily: 'var(--font-mono)' }}>$45,000</div>
                <div style={{ padding: '16px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', fontFamily: 'var(--font-mono)' }}>-$8,200</div>
              </div>
            </div>
            <div style={{ flex: '1 1 400px' }}>
              <div style={{ color: 'var(--accent-red)', fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 600, marginBottom: '16px' }}>02 / RECONCILIATION</div>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '36px', marginBottom: '24px' }}>Leakage Detector</h3>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '18px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>Compares expected vs. paid royalties across 1,000 titles and flags every discrepancy to the cent. Ensures maximum revenue retention.</p>
            </div>
          </div>

          {/* Feature 3 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '60px', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 400px' }}>
              <div style={{ color: 'var(--accent-amber)', fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 600, marginBottom: '16px' }}>03 / COMPLIANCE</div>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '36px', marginBottom: '24px' }}>Territory Violations</h3>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '18px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>Detects plays in unlicensed countries and expired license usage in real-time streaming logs. Pinpoints exactly where geographic breaches occur.</p>
            </div>
            <div style={{ flex: '1 1 500px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '32px', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Globe size={16} color="var(--text-muted)"/> <span>Brazil (BR)</span></div>
                   <span style={{ color: 'var(--danger)', fontFamily: 'var(--font-mono)' }}>842 Unlicensed</span>
                 </div>
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Globe size={16} color="var(--text-muted)"/> <span>Japan (JP)</span></div>
                   <span style={{ color: 'var(--danger)', fontFamily: 'var(--font-mono)' }}>315 Expired</span>
                 </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Value Proposition */}
      <section style={{ padding: '80px 24px', background: 'var(--bg-raised)', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)', position: 'relative', zIndex: 10 }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'center' }}>
          {['Contract AI', 'Agentic Workflows', 'Financial Audit Automation', 'Billing Accuracy', 'Revenue Protection', 'Explainable AI', 'Enterprise Ready'].map((tag, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '12px 20px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
              borderRadius: '30px', fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)'
            }}>
              <CheckCircle2 size={16} color="var(--accent-teal)" />
              {tag}
            </div>
          ))}
        </div>
      </section>

      {/* Footer CTA */}
      <section style={{ padding: '120px 24px', textAlign: 'center', position: 'relative', zIndex: 10 }}>
        <div style={{
          maxWidth: '800px', margin: '0 auto', background: 'var(--bg-card)', border: '1px solid var(--border-glow)',
          borderRadius: '24px', padding: '64px', position: 'relative', overflow: 'hidden',
          boxShadow: '0 0 80px rgba(0,217,192,0.1)'
        }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'var(--accent-teal)' }}/>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '40px', fontWeight: 800, marginBottom: '24px' }}>Start auditing in 60 seconds.</h2>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '18px', color: 'var(--text-secondary)', marginBottom: '40px' }}>Deploy the DLRA engine to your infrastructure and let AI reclaim your missing royalties.</p>
          <div style={{ display: 'flex', gap: '24px', justifyContent: 'center', alignItems: 'center' }}>
            <button onClick={() => navigate('/signup')} style={{
              background: 'var(--accent-teal)', color: 'var(--bg-void)',
              fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '16px',
              padding: '16px 40px', borderRadius: '4px', border: 'none', cursor: 'pointer',
              boxShadow: '0 0 30px rgba(0,217,192,0.4)', transition: 'transform 0.2s',
            }}
            onMouseOver={e=>e.currentTarget.style.transform='scale(1.05)'} onMouseOut={e=>e.currentTarget.style.transform='scale(1)'}
            >
              Try Demo Instance
            </button>
            <a href="#" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-body)', fontWeight: 600, textDecoration: 'none' }}>Schedule a Demo</a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '40px 24px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-muted)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldCheck size={16} /> DLRA Inc. © 2026
        </div>
        <div>
          Built with React + Supabase + Claude AI
        </div>
      </footer>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-15px); }
        }
      `}</style>
    </div>
  );
}
