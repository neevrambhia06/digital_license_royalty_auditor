import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import './LandingPage.css';

export default function LandingPage() {
  const navigate = useNavigate();

  const variants = {
    hidden: { opacity: 0, y: 14 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.14, duration: 0.45, ease: [0.22, 1, 0.36, 1] }
    })
  };
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <main className="dlra-landing">
      {/* BACKGROUND GLOW */}
      <div className="hero-glow" />

      {/* --- NAVIGATION --- */}
      <nav className={`nav ${scrolled ? 'scrolled' : ''}`} style={{ animation: 'fadeUp 0.3s ease-out forwards' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
          <div className="nav-left">
            <div className="logo-mark">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <span className="wordmark">DLRA</span>
          </div>
          <div className="nav-center">
            <a href="#products" className="nav-link">Products</a>
            <a href="#docs" className="nav-link">Docs</a>
            <a href="#changelog" className="nav-link">Changelog</a>
            <a href="#blog" className="nav-link">Blog</a>
          </div>
          <div className="nav-right">
            <Link to="/login" className="login-link">Log in</Link>
            <button onClick={() => navigate('/signup')} className="btn-nav-signup">Sign up</button>
          </div>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="section-hero container">
        <div className="hero-overline t-overline load-fade d-100">
          <div className="live-dot" /> END-TO-END ROYALTY INTELLIGENCE
        </div>

        <motion.h1 className="hero-headline">
          <motion.span
            className="line-1"
            variants={variants}
            initial="hidden"
            animate="visible"
            custom={0}
          >
            Audit, Detect and
          </motion.span>
          <motion.span
            className="line-framed"
            variants={variants}
            initial={{ opacity: 0, y: 14, borderBottomColor: 'transparent' }}
            animate={{ opacity: 1, y: 0, borderBottomColor: 'var(--gold-mid)' }}
            transition={{ 
                opacity: { delay: 0.14, duration: 0.45 },
                y: { delay: 0.14, duration: 0.45 },
                borderBottomColor: { delay: 0.32, duration: 0.4 }
            }}
            custom={1}
            style={{ originX: 0.5 }}
          >
            <span className="frame-inner">Find $52K in Leakage</span>
          </motion.span>
          <motion.span
            className="line-3"
            variants={variants}
            initial="hidden"
            animate="visible"
            custom={2}
          >
            Automatically.
          </motion.span>
        </motion.h1>

        <p className="hero-subheadline t-body-large load-fade d-500">
          AuditIQ detects underpayments, territory violations, and expired license usage — automatically.
        </p>

        <div className="hero-ctas load-fade d-700">
          <button onClick={() => navigate('/signup')} className="btn-primary">Start free audit</button>
          <button className="btn-secondary">Read docs</button>
        </div>

        <div className="hero-process load-fade d-900">
          <span className="process-step">Load contracts</span>
          <span className="process-divider">/</span>
          <span className="process-step">Bulletproof your data</span>
          <span className="process-divider">/</span>
          <span className="process-step">Find leakage instantly</span>
        </div>

        {/* Hero Terminal Window */}
        <div className="terminal-card load-fade d-1100">
          <div className="term-chrome">
            <div className="term-dots">
              <div className="term-dot r" />
              <div className="term-dot a" />
              <div className="term-dot g" />
            </div>
            <div className="term-title">auditor-engine ~ ./bin/detect</div>
          </div>
          <div className="term-body t-terminal">
            <div className="term-line load-fade" style={{ animationDelay: '1200ms' }}><span className="time">[14:32:01.012]</span> <span className="agent">[ContractReader]</span> Ingested 1,000 PDF agreements</div>
            <div className="term-line load-fade" style={{ animationDelay: '1300ms' }}><span className="time">[14:32:01.405]</span> <span className="agent">[StreamIngester]</span> Aggregated 14.2M streaming logs</div>
            <div className="term-line load-fade" style={{ animationDelay: '1400ms' }}><span className="time">[14:32:01.810]</span> <span className="agent">[TerritoryAgent]</span> Flagged 842 plays in unauthorized regions</div>
            <div className="term-line load-fade" style={{ animationDelay: '1500ms' }}><span className="time">[14:32:02.155]</span> <span className="agent">[ExpiryAgent]</span> 315 streams analyzed on expired terms</div>
            <div className="term-line load-fade" style={{ animationDelay: '1600ms' }}><span className="time">[14:32:02.800]</span> <span className="agent">[LedgerAgent]</span> Calculating discrepancy matrix...</div>
            <div className="term-line load-fade" style={{ animationDelay: '1700ms' }}><span className="time">[14:32:03.001]</span> <span className="agent">[LedgerAgent]</span> Discrepancy found. Expected: <span className="t-data-value">$94,200</span>. Paid: <span className="t-data-value">$41,860</span>.</div>
            <div className="term-line load-fade" style={{ animationDelay: '1800ms' }}><span className="time">[14:32:03.002]</span> <span className="alert">&gt;&gt; CRITICAL: $52,340 Leakage Detected across 8 contracts.</span></div>
            <div className="term-line load-fade" style={{ animationDelay: '1900ms' }}><span className="time">[14:32:03.015]</span> <span className="agent">[ReportGenerator]</span> Compliance JSON artifact generated.</div>
            <div className="term-line load-fade" style={{ animationDelay: '2000ms' }}><span className="term-cursor" /></div>
          </div>
        </div>
      </section>

      {/* --- SOCIAL PROOF --- */}
      <section className="section-marquee">
        <div className="marquee-label t-overline">TRUSTED BY</div>
        <h2 className="marquee-headline t-h2">Used by the world's leading streaming platforms</h2>
        <div className="marquee-track-wrapper">
          <div className="marquee-track">
            <div className="marquee-card">Spotify</div>
            <div className="marquee-card">Universal Music</div>
            <div className="marquee-card">Netflix</div>
            <div className="marquee-card">Sony Music</div>
            <div className="marquee-card">Warner Chappell</div>
            <div className="marquee-card">Tidal</div>
            <div className="marquee-card">BMG Rights</div>
            <div className="marquee-card">Kobalt</div>
            <div className="marquee-card">AudioMack</div>
            <div className="marquee-card">SoundCloud</div>
            {/* DUPLICATE SET FOR SEAMLESS LOOP */}
            <div className="marquee-card">Spotify</div>
            <div className="marquee-card">Universal Music</div>
            <div className="marquee-card">Netflix</div>
            <div className="marquee-card">Sony Music</div>
            <div className="marquee-card">Warner Chappell</div>
            <div className="marquee-card">Tidal</div>
            <div className="marquee-card">BMG Rights</div>
            <div className="marquee-card">Kobalt</div>
            <div className="marquee-card">AudioMack</div>
            <div className="marquee-card">SoundCloud</div>
          </div>
        </div>
      </section>

      {/* --- FEATURES SECTION --- */}
      <section className="section section-features container">

        {/* Feature 1 */}
        <div className="feature-row">
          <div className="feature-content">
            <div className="t-overline"><div className="overline-accent" /> CONTRACT PARSING</div>
            <h3 className="t-h3">Extract intelligence from unstructured law.</h3>
            <p className="t-body-large">Pipeline thousands of legal documents into a dynamic rule engine. No human review required. We convert PDFs to JSON.</p>
            <div className="feature-checkmarks">
              <div className="check-item"><div className="check-square" /> <span className="t-body">Extracts rules and tiers automatically</span></div>
              <div className="check-item"><div className="check-square" /> <span className="t-body">Captures geo-restrictions accurately</span></div>
              <div className="check-item"><div className="check-square" /> <span className="t-body">Identifies strict expiration clauses</span></div>
            </div>
          </div>
          <div className="feature-media right">
            <div className="mockup-card">
              <div className="mock-header t-card-title">Contract Extracted</div>
              <div className="mock-body">
                <div className="data-row"><span className="data-label">Entity</span><span className="data-val">Lionsgate Cinema</span></div>
                <div className="data-row"><span className="data-label">Tiers</span><span className="data-val">Tier 1: 30% / Tier 2: 45%</span></div>
                <div className="data-row" style={{ borderBottom: 'none', margin: 0, padding: 0 }}><span className="data-label">Expiry</span><span className="data-val">2027-12-31</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature 2 */}
        <div className="feature-row alt">
          <div className="feature-content">
            <div className="t-overline"><div className="overline-accent" /> LEAKAGE DETECTION</div>
            <h3 className="t-h3">Find every underpayment, to the cent.</h3>
            <p className="t-body-large">Our ledger reconciliation agent compares your massive streams log against your contract stipulations to pinpoint exactly where you are losing revenue.</p>
            <div className="feature-checkmarks">
              <div className="check-item"><div className="check-square" /> <span className="t-body">Billion-scale log aggregation</span></div>
              <div className="check-item"><div className="check-square" /> <span className="t-body">Micro-metric accuracy verification</span></div>
              <div className="check-item"><div className="check-square" /> <span className="t-body">Instant deficit isolation</span></div>
            </div>
          </div>
          <div className="feature-media left">
            <div className="mockup-card">
              <div className="mock-header t-card-title">Leakage Detected</div>
              <div className="mock-body">
                <div className="mock-table">
                  <div className="t-row header">
                    <div className="t-col t-header-label">Title</div>
                    <div className="t-col right t-header-label">Expected</div>
                    <div className="t-col right t-header-label">Delta</div>
                  </div>
                  <div className="t-row">
                    <div className="t-col t-cell-label">John Wick 4</div>
                    <div className="t-col right t-cell-val">$45,000</div>
                    <div className="t-col right t-cell-val error">-$8,200</div>
                  </div>
                  <div className="t-row" style={{ borderBottom: 'none', paddingBottom: 0 }}>
                    <div className="t-col t-cell-label">Dune (2021)</div>
                    <div className="t-col right t-cell-val">$22,400</div>
                    <div className="t-col right t-cell-val error">-$1,100</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature 3 */}
        <div className="feature-row">
          <div className="feature-content">
            <div className="t-overline"><div className="overline-accent" /> MULTI-AGENT PIPELINE</div>
            <h3 className="t-h3">A swarm of specialized agents at your command.</h3>
            <p className="t-body-large">Each audit triggers a chain of AI agents: extractors, geolocators, stream checkers, and ledger reconcilers, working seamlessly together.</p>
            <div className="feature-checkmarks">
              <div className="check-item"><div className="check-square" /> <span className="t-body">Modular pipeline architecture</span></div>
              <div className="check-item"><div className="check-square" /> <span className="t-body">Parallel compute execution</span></div>
              <div className="check-item"><div className="check-square" /> <span className="t-body">Bulletproof trace explanations</span></div>
            </div>
          </div>
          <div className="feature-media right">
            <div className="mockup-card">
              <div className="mock-header t-card-title">Pipeline Status</div>
              <div className="mock-body">
                <div className="agent-row">
                  <span className="t-body">Extractor</span>
                  <span className="badge active">ACTIVE</span>
                </div>
                <div className="agent-row">
                  <span className="t-body">Geo Check</span>
                  <span className="badge danger">VIOLATION</span>
                </div>
                <div className="agent-row" style={{ marginBottom: 0 }}>
                  <span className="t-body">Ledger Recon</span>
                  <span className="badge warning">WARNING</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature 4 */}
        <div className="feature-row alt" style={{ borderBottom: 'none', paddingBottom: 0, marginBottom: 0 }}>
          <div className="feature-content">
            <div className="t-overline"><div className="overline-accent" /> AUDIT DASHBOARD</div>
            <h3 className="t-h3">Your command center for revenue recovery.</h3>
            <p className="t-body-large">Visualize violations visually. Drill down into individual streams. Present unquestionable evidence to counterparts.</p>
            <div className="feature-checkmarks">
              <div className="check-item"><div className="check-square" /> <span className="t-body">Real-time telemetry reporting</span></div>
              <div className="check-item"><div className="check-square" /> <span className="t-body">Aggregated anomaly detection</span></div>
              <div className="check-item"><div className="check-square" /> <span className="t-body">Unified control surface</span></div>
            </div>
          </div>
          <div className="feature-media left">
            <div className="mockup-card full">
              <div className="dash-layout">
                <div className="dash-sidebar">
                  <div className="dash-item">Overview</div>
                  <div className="dash-item">Contracts</div>
                  <div className="dash-item active">Violations</div>
                </div>
                <div className="dash-main">
                  <div className="dash-metrics">
                    <div className="dash-metric">
                      <span className="metric-label">Total Leakage</span>
                      <span className="t-data-value" style={{ fontSize: '24px', color: 'var(--amber)' }}>$52,340</span>
                    </div>
                    <div className="dash-metric">
                      <span className="metric-label">Violations</span>
                      <span className="t-data-value" style={{ fontSize: '24px', color: 'var(--red)' }}>842</span>
                    </div>
                  </div>
                  {/* Abstract Chart & Table representations could go here */}
                  <div style={{ height: '60px', background: 'var(--border)', borderRadius: '4px', marginBottom: '16px', opacity: 0.5 }} />
                  <div style={{ height: '40px', background: 'var(--border)', borderRadius: '4px', opacity: 0.5 }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- DASHBOARD PREVIEW --- */}
      <section className="section dash-preview container">
        <div className="dp-label t-overline">AUDIT DASHBOARD · SCROLL TO EXPLORE</div>
        <h2 className="t-h2" style={{ marginBottom: '16px' }}>Scroll to explore the audit dashboard</h2>
        <p className="t-body-large">Every audit saved. Every violation logged. Every agent traced.</p>
        <div className="dp-mockup-wrap">
          <div className="dp-chrome">
            <div className="term-dot r" />
            <div className="term-dot a" />
            <div className="term-dot g" />
          </div>
          <div style={{ padding: '32px', display: 'flex', gap: '24px', flex: 1 }}>
            <div style={{ width: '200px', borderRight: '1px solid var(--border)' }}>
              {/* Sidebar mock */}
              <div style={{ padding: '12px 16px', color: 'var(--teal)', background: 'var(--teal-dim)', borderRadius: '4px', fontSize: '14px' }}>Executive Summary</div>
              <div style={{ padding: '12px 16px', color: 'var(--text-3)', fontSize: '14px' }}>Anomaly Reports</div>
              <div style={{ padding: '12px 16px', color: 'var(--text-3)', fontSize: '14px' }}>Territory Logs</div>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'flex', gap: '24px' }}>
                <div style={{ flex: 1, height: '100px', background: 'var(--base)', border: '1px solid var(--border)', borderRadius: '6px' }} />
                <div style={{ flex: 1, height: '100px', background: 'var(--base)', border: '1px solid var(--border)', borderRadius: '6px' }} />
                <div style={{ flex: 1, height: '100px', background: 'var(--base)', border: '1px solid var(--border)', borderRadius: '6px' }} />
              </div>
              <div style={{ flex: 1, background: 'var(--base)', border: '1px solid var(--border)', borderRadius: '6px' }} />
            </div>
          </div>
        </div>
      </section>

      {/* --- COMPLIANCE SECTION --- */}
      <section className="section compliance">
        <div className="container comp-grid">
          <div className="comp-content">
            <div className="t-overline" style={{ marginBottom: '24px' }}>COMPLIANCE OUTPUT</div>
            <h2 className="t-h2" style={{ marginBottom: '24px' }}>Regulator-ready audit reports.</h2>
            <p className="t-body-large">Every discrepancy is traced, documented, and fully auditable by law. Export actionable data straight into JSON or CSV for accounting remediation.</p>
            <div className="comp-tags">
              <span className="comp-tag">JSON Export</span>
              <span className="comp-tag">CSV Download</span>
            </div>
          </div>
          <div className="comp-code">
            <div className="code-block">
              <div className="code-accent" />
              <pre><code>{`{
  "audit_id": "AUD-5928-VX",
  "status": "COMPLETED",
  "findings": {
    "total_leakage": 52340.00,
    "confidence_score": 0.992,
    "violations": [
      {
        "type": "territory_breach",
        "region": "BR",
        "streams": 842,
        "impact": 1204.50
      }
    ]
  }
}`}</code></pre>
            </div>
          </div>
        </div>
      </section>

      {/* --- ANALYTICS SECTION --- */}
      <section className="section section-analytics container">
        <h2 className="t-h2">Understand your royalty landscape</h2>
        <div className="pie-mockup">
          <div className="pie-css" />
          <div className="pie-legend">
            <div className="leg-item"><div className="leg-dot t" /> Valid Royalties</div>
            <div className="leg-item"><div className="leg-dot a" /> Rate Mismatch</div>
            <div className="leg-item"><div className="leg-dot r" /> Unauthorized Region</div>
          </div>
        </div>
      </section>

      {/* --- NL QUERY SECTION --- */}
      <section className="section section-nlq container">
        <h2 className="t-h2">Natural language queries. Answered.</h2>
        <div className="chat-wrap">
          <div className="chat-q">"Show me all overpayments to Sony Music in Q3."</div>
          <div className="chat-a">
            <strong style={{ display: 'block', marginBottom: '8px', color: 'var(--text-1)' }}>Agent Response:</strong>
            I found 3 contracts with Sony Music spanning Q3. Total overpayments amount to <span className="amber">$18,450</span>, primarily driven by a tiered rate dispute in 'Contract A-12'.
          </div>
        </div>
      </section>

      {/* --- PITCH STRIP --- */}
      <section className="pitch-strip">
        <div className="container">
          <div className="pitch-text">We audited 1,000 contracts in 3 seconds</div>
          <div className="t-hero-number">$52,340 in royalty leakage</div>
          <div className="pitch-text">8 AI agents. Zero human review. Fully explainable.</div>
        </div>
      </section>

      {/* --- FINAL CTA --- */}
      <section className="section final-cta container">
        <div className="cta-logo">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        </div>
        <h2 className="t-h1" style={{ marginBottom: '24px' }}>Start auditing in 60 seconds.</h2>
        <p className="t-body-large" style={{ maxWidth: '600px', marginBottom: '40px' }}>Deploy the AuditIQ engine to your infrastructure and let AI reclaim your missing royalties.</p>
        <div style={{ display: 'flex', gap: '16px' }}>
          <button onClick={() => navigate('/signup')} className="btn-primary">Start free audit</button>
          <button className="btn-secondary">Request enterprise demo</button>
        </div>
        <div className="cta-assure">No billing. No setup. Synthetic data included.</div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="footer container">
        <div className="foot-left">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          AuditIQ Inc. © 2026
        </div>
        <div className="foot-links">
          <a href="#docs">Docs</a>
          <a href="#github">GitHub</a>
          <a href="#architecture">Architecture</a>
          <a href="#changelog">Changelog</a>
        </div>
      </footer>
    </main>
  );
}
