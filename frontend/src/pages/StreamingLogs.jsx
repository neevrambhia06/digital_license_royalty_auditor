import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Activity, Pause, Play, Filter } from 'lucide-react';
import MetricCard from '../components/ui/MetricCard';

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } }
};
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } }
};

const CONTENT_IDS = [
  'Movie_001', 'Show_042', 'Album_118', 'Podcast_003', 'Movie_077',
  'Show_199', 'Album_055', 'Podcast_021', 'Movie_134', 'Show_088',
  'Album_200', 'Movie_015', 'Show_156', 'Podcast_044', 'Album_091'
];
const COUNTRIES = ['US', 'CA', 'UK', 'IN', 'DE', 'JP', 'BR', 'AU', 'FR'];
const USER_TYPES = ['premium', 'free', 'trial'];
const DEVICES = ['mobile', 'desktop', 'tv', 'tablet'];

function randomItem(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randomPlays() { return Math.max(1, Math.floor(Math.exp(Math.random() * 2))); }

function generateLogEntry(idx) {
  const now = new Date();
  const offset = Math.floor(Math.random() * 86400000);
  const ts = new Date(now.getTime() - offset);
  const country = randomItem(COUNTRIES);
  const contentId = randomItem(CONTENT_IDS);
  const plays = randomPlays();
  const userType = randomItem(USER_TYPES);
  const device = randomItem(DEVICES);
  const isTerritoryViolation = Math.random() < 0.02;

  return {
    id: `PL${String(100000 + idx).padStart(8, '0')}`,
    timestamp: ts.toISOString(),
    content_id: contentId,
    country,
    plays,
    user_type: userType,
    device,
    flagged: isTerritoryViolation
  };
}

function formatTime(iso) {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

const TYPE_COLORS = {
  premium: 'var(--accent-teal)',
  free: 'var(--text-secondary)',
  trial: 'var(--accent-amber)'
};

const DEVICE_SYMBOLS = {
  mobile: 'MOB',
  desktop: 'DSK',
  tv: 'TV ',
  tablet: 'TAB'
};

export default function StreamingLogs() {
  const [logs, setLogs] = useState(() => {
    const initial = [];
    for (let i = 0; i < 80; i++) {
      initial.push(generateLogEntry(i));
    }
    return initial.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  });
  const [isPaused, setIsPaused] = useState(false);
  const [filterDevice, setFilterDevice] = useState('all');
  const scrollRef = useRef(null);
  const counterRef = useRef(80);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setLogs(prev => {
        const newLog = generateLogEntry(counterRef.current++);
        newLog.timestamp = new Date().toISOString();
        const updated = [newLog, ...prev];
        if (updated.length > 200) updated.pop();
        return updated;
      });
    }, 800);
    return () => clearInterval(interval);
  }, [isPaused]);

  const filtered = filterDevice === 'all' ? logs : logs.filter(l => l.device === filterDevice);
  const totalPlays = logs.reduce((s, l) => s + l.plays, 0);
  const flaggedCount = logs.filter(l => l.flagged).length;

  return (
    <motion.div variants={stagger} initial="hidden" animate="show">
      {/* Header */}
      <motion.div variants={fadeUp} style={{ marginBottom: '32px' }}>
        <h1 style={{
          fontFamily: 'var(--font-heading)',
          fontSize: '28px',
          fontWeight: 800,
          color: 'var(--text-primary)',
          marginBottom: '6px'
        }}>
          Streaming Logs
        </h1>
        <p style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '13px',
          color: 'var(--text-muted)',
          letterSpacing: '0.02em'
        }}>
          Live event feed -- {isPaused ? 'PAUSED' : 'STREAMING'}
        </p>
      </motion.div>

      {/* Metrics */}
      <motion.div variants={fadeUp} style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <MetricCard label="Events Buffered" value={logs.length} color="var(--accent-teal)" icon={Activity} sublabel="In current session" />
        <MetricCard label="Total Plays" value={totalPlays} color="var(--accent-purple)" sublabel="Aggregate stream count" />
        <MetricCard label="Flagged Events" value={flaggedCount} color="var(--danger)" sublabel="Territory violations" />
      </motion.div>

      {/* Controls */}
      <motion.div variants={fadeUp} style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '16px'
      }}>
        <button
          onClick={() => setIsPaused(!isPaused)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
            fontWeight: 600,
            padding: '6px 14px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid',
            borderColor: isPaused ? 'var(--success)' : 'var(--accent-amber)',
            background: isPaused ? 'rgba(34,197,94,0.08)' : 'rgba(245,166,35,0.08)',
            color: isPaused ? 'var(--success)' : 'var(--accent-amber)',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          {isPaused ? <Play size={12} /> : <Pause size={12} />}
          {isPaused ? 'RESUME' : 'PAUSE'}
        </button>

        <div style={{ display: 'flex', gap: '4px' }}>
          {['all', ...DEVICES].map(d => (
            <button
              key={d}
              onClick={() => setFilterDevice(d)}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                textTransform: 'uppercase',
                padding: '6px 10px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid',
                borderColor: filterDevice === d ? 'var(--accent-teal)' : 'var(--border-subtle)',
                background: filterDevice === d ? 'rgba(0,217,192,0.08)' : 'transparent',
                color: filterDevice === d ? 'var(--accent-teal)' : 'var(--text-muted)',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {d}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Terminal-style log viewer */}
      <motion.div variants={fadeUp} style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden'
      }}>
        {/* Terminal header */}
        <div style={{
          padding: '10px 16px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: isPaused ? 'var(--accent-amber)' : 'var(--success)',
              boxShadow: isPaused ? '0 0 6px var(--accent-amber)' : '0 0 6px var(--success)',
              animation: isPaused ? 'none' : 'pulse 2s infinite'
            }} />
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              color: 'var(--text-secondary)'
            }}>
              stream://events/live
            </span>
          </div>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            color: 'var(--text-muted)'
          }}>
            {filtered.length} entries
          </span>
        </div>

        {/* Log lines */}
        <div
          ref={scrollRef}
          style={{
            maxHeight: '520px',
            overflowY: 'auto',
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
            lineHeight: '1.8'
          }}
        >
          {filtered.map((log, idx) => (
            <div
              key={log.id + idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '4px 16px',
                borderBottom: '1px solid rgba(31,45,61,0.2)',
                background: log.flagged ? 'rgba(239,68,68,0.04)' : 'transparent',
                transition: 'background 0.1s ease'
              }}
              onMouseOver={(e) => { e.currentTarget.style.background = log.flagged ? 'rgba(239,68,68,0.08)' : 'var(--bg-card-hover)'; }}
              onMouseOut={(e) => { e.currentTarget.style.background = log.flagged ? 'rgba(239,68,68,0.04)' : 'transparent'; }}
            >
              <span style={{ color: 'var(--text-muted)', minWidth: '64px' }}>{formatTime(log.timestamp)}</span>
              <span style={{ color: 'var(--accent-teal)', minWidth: '100px' }}>{log.id}</span>
              <span style={{ color: 'var(--text-primary)', minWidth: '100px' }}>{log.content_id}</span>
              <span style={{ color: 'var(--text-secondary)', minWidth: '28px', textAlign: 'center' }}>{log.country}</span>
              <span style={{ color: 'var(--text-primary)', minWidth: '40px', textAlign: 'right' }}>{log.plays}x</span>
              <span style={{ color: TYPE_COLORS[log.user_type], minWidth: '60px' }}>{log.user_type}</span>
              <span style={{ color: 'var(--text-muted)', minWidth: '32px' }}>{DEVICE_SYMBOLS[log.device]}</span>
              {log.flagged && (
                <span style={{
                  color: 'var(--danger)',
                  fontSize: '10px',
                  padding: '1px 6px',
                  border: '1px solid rgba(239,68,68,0.3)',
                  borderRadius: '2px',
                  background: 'rgba(239,68,68,0.08)'
                }}>
                  TERRITORY
                </span>
              )}
            </div>
          ))}
        </div>
      </motion.div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </motion.div>
  );
}
