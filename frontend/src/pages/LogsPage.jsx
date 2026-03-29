import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import {
  Activity, AlertTriangle, Globe, FileText, ChevronDown, ChevronRight,
  Filter, X, ToggleLeft, ToggleRight, ChevronLeft
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import Card from '../components/ui/Card';
import { supabase } from '../supabase';

/* ═══════════════════════════════════════════════════════════════════════
   ANIMATION VARIANTS
   ═══════════════════════════════════════════════════════════════════════ */
const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

/* ═══════════════════════════════════════════════════════════════════════
   SPRING-ANIMATED NUMBER
   ═══════════════════════════════════════════════════════════════════════ */
function SpringNumber({ value, color, fontSize = '36px' }) {
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { damping: 30, stiffness: 100 });
  const display = useTransform(spring, (v) => Math.round(v).toLocaleString());

  useEffect(() => { mv.set(value); }, [value, mv]);

  return (
    <motion.span style={{
      fontFamily: 'var(--font-mono)',
      fontSize,
      fontWeight: 700,
      lineHeight: 1,
      color: color || 'var(--text-primary)',
      letterSpacing: '-0.02em',
    }}>
      {display}
    </motion.span>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════════════════════════════ */
const COUNTRIES_ALL = ['US', 'CA', 'UK', 'IN', 'DE', 'JP', 'BR', 'AU', 'FR'];
const USER_TYPES = ['free', 'premium', 'trial'];
const DEVICES = ['mobile', 'desktop', 'tv', 'tablet'];

const COUNTRY_FLAGS = {
  US: 'US', CA: 'CA', UK: 'GB', IN: 'IN', DE: 'DE',
  JP: 'JP', BR: 'BR', AU: 'AU', FR: 'FR',
};

function countryLabel(code) {
  return code;
}

/* ═══════════════════════════════════════════════════════════════════════
   MOCK DATA GENERATOR
   (Generates realistic data locally so the page works without Supabase)
   ═══════════════════════════════════════════════════════════════════════ */
function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

const CONTENT_IDS = [
  'Movie_001', 'Movie_015', 'Movie_077', 'Movie_134',
  'Show_042', 'Show_088', 'Show_156', 'Show_199',
  'Album_055', 'Album_091', 'Album_118', 'Album_200',
  'Podcast_003', 'Podcast_021', 'Podcast_044',
];

function generateMockAggregation() {
  const maxPlays = 50000;
  return CONTENT_IDS.map((cid) => {
    const countries = [];
    const n = randInt(2, 9);
    const pool = [...COUNTRIES_ALL];
    for (let i = 0; i < n; i++) {
      const idx = randInt(0, pool.length - 1);
      countries.push(pool.splice(idx, 1)[0]);
    }
    const totalPlays = randInt(800, maxPlays);
    const hasAnomaly = Math.random() < 0.18;
    const anomalyTypes = hasAnomaly
      ? [rand(['TERRITORY_VIOLATION', 'EXPIRED_LICENSE', 'STATISTICAL_OUTLIER'])]
      : [];

    const startDate = new Date(2024, randInt(0, 6), randInt(1, 28));
    const endDate = new Date(2024, randInt(7, 11), randInt(1, 28));

    return {
      content_id: cid,
      total_plays: totalPlays,
      countries,
      date_range: { min: startDate.toISOString(), max: endDate.toISOString() },
      has_anomaly: hasAnomaly,
      anomaly_types: anomalyTypes,
    };
  }).sort((a, b) => b.total_plays - a.total_plays);
}

function generateMockAnomalies(count = 35) {
  const types = ['TERRITORY_VIOLATION', 'EXPIRED_LICENSE', 'STATISTICAL_OUTLIER'];
  const anomalies = [];
  for (let i = 0; i < count; i++) {
    const ts = new Date(Date.now() - randInt(0, 86400000 * 7));
    anomalies.push({
      play_id: `PL_${String(100000 + i).padStart(8, '0')}`,
      content_id: rand(CONTENT_IDS),
      country: rand(COUNTRIES_ALL),
      plays: randInt(1, 50),
      timestamp: ts.toISOString(),
      user_type: rand(USER_TYPES),
      device: rand(DEVICES),
      violation_types: [rand(types)],
    });
  }
  return anomalies.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

function generateMockCountryBreakdown(contentId) {
  const countries = COUNTRIES_ALL.filter(() => Math.random() > 0.3);
  if (countries.length === 0) countries.push('US');
  return countries.map((c) => ({ country: c, plays: randInt(200, 12000) })).sort((a, b) => b.plays - a.plays);
}

function generateMockRawLogs(count = 2000) {
  const logs = [];
  for (let i = 0; i < count; i++) {
    const ts = new Date(Date.now() - randInt(0, 86400000 * 30));
    logs.push({
      play_id: `PL_${String(i).padStart(8, '0')}`,
      content_id: rand(CONTENT_IDS),
      timestamp: ts.toISOString(),
      country: rand(COUNTRIES_ALL),
      plays: randInt(1, 20),
      user_type: rand(USER_TYPES),
      device: rand(DEVICES),
    });
  }
  return logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

/* ═══════════════════════════════════════════════════════════════════════
   VIOLATION TYPE LABELS
   ═══════════════════════════════════════════════════════════════════════ */
const VIOLATION_LABELS = {
  TERRITORY_VIOLATION: 'TERRITORY',
  EXPIRED_LICENSE: 'EXPIRED',
  STATISTICAL_OUTLIER: 'OUTLIER',
};

const VIOLATION_COLORS = {
  TERRITORY_VIOLATION: 'var(--accent-red)',
  EXPIRED_LICENSE: 'var(--accent-amber)',
  STATISTICAL_OUTLIER: 'var(--accent-purple)',
};

/* ═══════════════════════════════════════════════════════════════════════
   INLINE BAR (mini bar chart behind a number in the table)
   ═══════════════════════════════════════════════════════════════════════ */
function InlineBar({ value, max }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', minWidth: '120px' }}>
      <div style={{
        position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
        width: `${pct}%`, height: '22px', borderRadius: '2px',
        background: 'linear-gradient(90deg, rgba(0,217,192,0.06) 0%, rgba(0,217,192,0.14) 100%)',
      }} />
      <span style={{
        position: 'relative', fontFamily: 'var(--font-mono)', fontSize: '14px',
        fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.01em',
      }}>
        {value.toLocaleString()}
      </span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   ANOMALY BADGE
   ═══════════════════════════════════════════════════════════════════════ */
function AnomalyBadge({ hasAnomaly, types = [] }) {
  if (!hasAnomaly) {
    return (
      <span style={{
        fontFamily: 'var(--font-mono)', fontSize: '11px',
        color: 'var(--success)', padding: '2px 8px',
        border: '1px solid rgba(34,197,94,0.25)', borderRadius: '2px',
        background: 'rgba(34,197,94,0.06)',
      }}>
        CLEAN
      </span>
    );
  }
  const type = types[0] || 'TERRITORY_VIOLATION';
  const color = VIOLATION_COLORS[type] || 'var(--accent-red)';
  return (
    <span style={{
      fontFamily: 'var(--font-mono)', fontSize: '11px',
      color, padding: '2px 8px',
      border: `1px solid ${color}40`, borderRadius: '2px',
      background: `${color}0F`,
    }}>
      {VIOLATION_LABELS[type] || 'FLAGGED'}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   COUNTRY BREAKDOWN BAR CHART (inline expanded row)
   ═══════════════════════════════════════════════════════════════════════ */
function CountryBreakdownChart({ contentId }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    // Simulate async fetch
    const timeout = setTimeout(() => {
      setData(generateMockCountryBreakdown(contentId));
    }, 300);
    return () => clearTimeout(timeout);
  }, [contentId]);

  if (!data) {
    return (
      <div style={{ padding: '20px', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-muted)' }}>
        Loading breakdown...
      </div>
    );
  }

  return (
    <div style={{ padding: '16px 0' }}>
      <div style={{
        fontFamily: 'var(--font-mono)', fontSize: '11px',
        color: 'var(--text-muted)', marginBottom: '12px', textTransform: 'uppercase',
        letterSpacing: '0.06em',
      }}>
        Plays by Country -- {contentId}
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} layout="vertical" margin={{ left: 40, right: 20, top: 0, bottom: 0 }}>
          <XAxis type="number" hide />
          <YAxis
            dataKey="country" type="category" width={36}
            tick={{ fontSize: 11, fontFamily: 'var(--font-mono)', fill: 'var(--text-secondary)' }}
            axisLine={false} tickLine={false}
          />
          <Tooltip
            contentStyle={{
              background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
              borderRadius: '4px', fontFamily: 'var(--font-mono)', fontSize: '12px',
              color: 'var(--text-primary)',
            }}
            formatter={(v) => [v.toLocaleString(), 'Plays']}
          />
          <Bar dataKey="plays" radius={[0, 3, 3, 0]} barSize={16}>
            {data.map((entry, i) => (
              <Cell key={entry.country} fill={i === 0 ? 'var(--accent-teal)' : 'rgba(0,217,192,0.35)'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   FILTER BAR
   ═══════════════════════════════════════════════════════════════════════ */
function FilterBar({ filters, onFiltersChange }) {
  const [expanded, setExpanded] = useState(false);

  const toggleCountry = (c) => {
    const next = filters.countries.includes(c)
      ? filters.countries.filter((x) => x !== c)
      : [...filters.countries, c];
    onFiltersChange({ ...filters, countries: next });
  };

  return (
    <motion.div variants={fadeUp} style={{ marginBottom: '20px' }}>
      {/* Toggle bar */}
      <button
        onClick={() => setExpanded((p) => !p)}
        style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          fontFamily: 'var(--font-mono)', fontSize: '12px',
          color: expanded ? 'var(--accent-teal)' : 'var(--text-muted)',
          background: 'transparent', border: '1px solid',
          borderColor: expanded ? 'var(--accent-teal)' : 'var(--border-subtle)',
          borderRadius: 'var(--radius-sm)', padding: '7px 14px',
          cursor: 'pointer', transition: 'all 0.15s ease',
        }}
      >
        <Filter size={13} />
        FILTERS
        {expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        {(filters.countries.length > 0 || filters.userType || filters.device || filters.anomaliesOnly) && (
          <span style={{
            marginLeft: '4px', fontSize: '10px', padding: '1px 6px',
            borderRadius: '2px', background: 'rgba(0,217,192,0.12)',
            color: 'var(--accent-teal)',
          }}>
            ACTIVE
          </span>
        )}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{
              marginTop: '12px', padding: '16px',
              background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px',
            }}>
              {/* Country multi-select */}
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Country
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {COUNTRIES_ALL.map((c) => {
                    const active = filters.countries.includes(c);
                    return (
                      <button
                        key={c}
                        onClick={() => toggleCountry(c)}
                        style={{
                          fontFamily: 'var(--font-mono)', fontSize: '11px',
                          padding: '4px 8px', borderRadius: '2px',
                          border: '1px solid',
                          borderColor: active ? 'var(--accent-teal)' : 'var(--border-subtle)',
                          background: active ? 'rgba(0,217,192,0.08)' : 'transparent',
                          color: active ? 'var(--accent-teal)' : 'var(--text-muted)',
                          cursor: 'pointer', transition: 'all 0.12s ease',
                        }}
                      >
                        {c}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* User type */}
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  User Type
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {['all', ...USER_TYPES].map((t) => {
                    const active = t === 'all' ? !filters.userType : filters.userType === t;
                    return (
                      <button
                        key={t}
                        onClick={() => onFiltersChange({ ...filters, userType: t === 'all' ? null : t })}
                        style={{
                          fontFamily: 'var(--font-mono)', fontSize: '11px',
                          padding: '4px 8px', borderRadius: '2px',
                          border: '1px solid',
                          borderColor: active ? 'var(--accent-teal)' : 'var(--border-subtle)',
                          background: active ? 'rgba(0,217,192,0.08)' : 'transparent',
                          color: active ? 'var(--accent-teal)' : 'var(--text-muted)',
                          cursor: 'pointer', transition: 'all 0.12s ease',
                          textTransform: 'uppercase',
                        }}
                      >
                        {t}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Device type */}
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Device
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {['all', ...DEVICES].map((d) => {
                    const active = d === 'all' ? !filters.device : filters.device === d;
                    return (
                      <button
                        key={d}
                        onClick={() => onFiltersChange({ ...filters, device: d === 'all' ? null : d })}
                        style={{
                          fontFamily: 'var(--font-mono)', fontSize: '11px',
                          padding: '4px 8px', borderRadius: '2px',
                          border: '1px solid',
                          borderColor: active ? 'var(--accent-teal)' : 'var(--border-subtle)',
                          background: active ? 'rgba(0,217,192,0.08)' : 'transparent',
                          color: active ? 'var(--accent-teal)' : 'var(--text-muted)',
                          cursor: 'pointer', transition: 'all 0.12s ease',
                          textTransform: 'uppercase',
                        }}
                      >
                        {d}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Anomalies only toggle */}
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Show Only Anomalies
                </div>
                <button
                  onClick={() => onFiltersChange({ ...filters, anomaliesOnly: !filters.anomaliesOnly })}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    fontFamily: 'var(--font-mono)', fontSize: '11px',
                    padding: '6px 12px', borderRadius: '2px',
                    border: '1px solid',
                    borderColor: filters.anomaliesOnly ? 'var(--accent-red)' : 'var(--border-subtle)',
                    background: filters.anomaliesOnly ? 'rgba(255,77,77,0.08)' : 'transparent',
                    color: filters.anomaliesOnly ? 'var(--accent-red)' : 'var(--text-muted)',
                    cursor: 'pointer', transition: 'all 0.12s ease',
                  }}
                >
                  {filters.anomaliesOnly ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                  {filters.anomaliesOnly ? 'ON' : 'OFF'}
                </button>
              </div>

              {/* Clear all */}
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button
                  onClick={() => onFiltersChange({ countries: [], userType: null, device: null, anomaliesOnly: false })}
                  style={{
                    fontFamily: 'var(--font-mono)', fontSize: '11px',
                    padding: '6px 12px', borderRadius: '2px',
                    border: '1px solid var(--border-subtle)',
                    background: 'transparent', color: 'var(--text-muted)',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
                  }}
                >
                  <X size={12} /> CLEAR
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   ANOMALY PANEL (right sidebar)
   ═══════════════════════════════════════════════════════════════════════ */
function AnomalyPanel({ anomalies, isOpen, onToggle }) {
  return (
    <div style={{
      position: 'fixed', right: isOpen ? 0 : '-380px', top: 0, bottom: 0,
      width: '380px', zIndex: 50,
      background: 'var(--bg-base)',
      borderLeft: '1px solid var(--border-subtle)',
      display: 'flex', flexDirection: 'column',
      transition: 'right 0.3s ease',
      boxShadow: isOpen ? '-8px 0 40px rgba(0,0,0,0.5)' : 'none',
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <AlertTriangle size={16} color="var(--accent-red)" />
          <span style={{
            fontFamily: 'var(--font-heading)', fontSize: '15px',
            fontWeight: 700, color: 'var(--text-primary)',
          }}>
            Anomaly Feed
          </span>
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: '10px',
            padding: '2px 6px', borderRadius: '2px',
            background: 'rgba(255,77,77,0.12)', color: 'var(--accent-red)',
          }}>
            {anomalies.length}
          </span>
        </div>
        <button
          onClick={onToggle}
          style={{
            background: 'transparent', border: 'none',
            color: 'var(--text-muted)', cursor: 'pointer',
            padding: '4px', display: 'flex',
          }}
        >
          <X size={16} />
        </button>
      </div>

      {/* Feed */}
      <div style={{ flex: 1, overflowY: 'auto', fontFamily: 'var(--font-mono)' }}>
        {anomalies.map((a, i) => (
          <div
            key={a.play_id + i}
            style={{
              padding: '12px 20px', borderBottom: '1px solid rgba(31,45,61,0.3)',
              borderLeft: `3px solid ${VIOLATION_COLORS[a.violation_types[0]] || 'var(--accent-red)'}`,
              transition: 'background 0.1s ease',
            }}
            onMouseOver={(e) => { e.currentTarget.style.background = 'var(--bg-card)'; }}
            onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '12px', color: 'var(--accent-teal)' }}>{a.content_id}</span>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                {new Date(a.timestamp).toLocaleTimeString('en-US', { hour12: false })}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
              {a.violation_types.map((vt) => (
                <span key={vt} style={{
                  fontSize: '10px', padding: '1px 6px', borderRadius: '2px',
                  color: VIOLATION_COLORS[vt] || 'var(--accent-red)',
                  border: `1px solid ${(VIOLATION_COLORS[vt] || 'var(--accent-red)')}40`,
                  background: `${(VIOLATION_COLORS[vt] || 'var(--accent-red)')}0F`,
                }}>
                  {VIOLATION_LABELS[vt] || vt}
                </span>
              ))}
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{a.country}</span>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{a.plays}x</span>
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
              {a.play_id} / {a.user_type} / {a.device}
            </div>
          </div>
        ))}

        {/* Blinking cursor at bottom */}
        <div style={{
          padding: '12px 20px', fontSize: '12px', color: 'var(--accent-teal)',
        }}>
          <span style={{ animation: 'anomalyBlink 1s step-end infinite' }}>_</span>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   TOGGLE BUTTON for anomaly panel
   ═══════════════════════════════════════════════════════════════════════ */
function AnomalyToggle({ count, isOpen, onToggle }) {
  return (
    <button
      onClick={onToggle}
      style={{
        position: 'fixed', right: isOpen ? '392px' : '16px', top: '72px', zIndex: 51,
        display: 'flex', alignItems: 'center', gap: '6px',
        fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 600,
        padding: '8px 14px', borderRadius: 'var(--radius-sm)',
        border: '1px solid',
        borderColor: count > 0 ? 'var(--accent-red)' : 'var(--border-subtle)',
        background: count > 0 ? 'rgba(255,77,77,0.08)' : 'var(--bg-card)',
        color: count > 0 ? 'var(--accent-red)' : 'var(--text-muted)',
        cursor: 'pointer', transition: 'all 0.3s ease',
        boxShadow: count > 0 ? '0 0 12px rgba(255,77,77,0.15)' : 'none',
      }}
    >
      <AlertTriangle size={13} />
      {count}
      {!isOpen && <ChevronLeft size={13} />}
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   MAIN: LogsPage
   ═══════════════════════════════════════════════════════════════════════ */
export default function LogsPage() {
  // ── State ──────────────────────────────────────────────────────────
  const [aggregation, setAggregation] = useState([]);
  const [anomalies, setAnomalies] = useState([]);
  const [rawLogs, setRawLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState(null);
  const [anomalyPanelOpen, setAnomalyPanelOpen] = useState(false);
  const [filters, setFilters] = useState({
    countries: [],
    userType: null,
    device: null,
    anomaliesOnly: false,
  });

  // RAW log pagination
  const [rawPage, setRawPage] = useState(1);
  const RAW_PER_PAGE = 50;

  // ── Fetch data ─────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        // Try Supabase first
        const { data: logs, error } = await supabase
          .from('streaming_logs')
          .select('*')
          .limit(5);

        if (error || !logs || logs.length === 0) {
          throw new Error('No data');
        }

        // If Supabase has data, use the agent
        const { streamingLogAgent } = await import('../agents/streamingLogAgent');
        const [agg, anom] = await Promise.all([
          streamingLogAgent.aggregateByContent(),
          streamingLogAgent.detectAnomalies(),
        ]);

        const { data: allLogs } = await supabase
          .from('streaming_logs')
          .select('*')
          .order('timestamp', { ascending: false })
          .limit(5000);

        setAggregation(agg.map((a) => ({
          ...a,
          has_anomaly: anom.some((an) => an.content_id === a.content_id),
          anomaly_types: [...new Set(anom.filter((an) => an.content_id === a.content_id).flatMap((an) => an.violation_types))],
        })));
        setAnomalies(anom);
        setRawLogs(allLogs || []);
      } catch {
        // Fallback to mock data
        setAggregation(generateMockAggregation());
        setAnomalies(generateMockAnomalies());
        setRawLogs(generateMockRawLogs(2000));
      }
      setLoading(false);
    }
    load();
  }, []);

  // ── Computed ───────────────────────────────────────────────────────
  const totalPlays = useMemo(() => aggregation.reduce((s, a) => s + a.total_plays, 0), [aggregation]);
  const uniqueTitles = aggregation.length;
  const countriesActive = useMemo(() => new Set(aggregation.flatMap((a) => a.countries)).size, [aggregation]);
  const anomalyCount = anomalies.length;
  const maxPlays = useMemo(() => Math.max(...aggregation.map((a) => a.total_plays), 1), [aggregation]);

  // ── Filtered aggregation ───────────────────────────────────────────
  const filteredAggregation = useMemo(() => {
    let result = aggregation;
    if (filters.countries.length > 0) {
      result = result.filter((a) => a.countries.some((c) => filters.countries.includes(c)));
    }
    if (filters.anomaliesOnly) {
      result = result.filter((a) => a.has_anomaly);
    }
    return result;
  }, [aggregation, filters]);

  // ── Filtered raw logs ──────────────────────────────────────────────
  const filteredRawLogs = useMemo(() => {
    let result = rawLogs;
    if (filters.countries.length > 0) {
      result = result.filter((l) => filters.countries.includes(l.country));
    }
    if (filters.userType) {
      result = result.filter((l) => l.user_type === filters.userType);
    }
    if (filters.device) {
      result = result.filter((l) => l.device === filters.device);
    }
    return result;
  }, [rawLogs, filters]);

  const totalRawPages = Math.ceil(filteredRawLogs.length / RAW_PER_PAGE);
  const paginatedRawLogs = filteredRawLogs.slice((rawPage - 1) * RAW_PER_PAGE, rawPage * RAW_PER_PAGE);

  // ── Event handlers ─────────────────────────────────────────────────
  const toggleRow = useCallback((contentId) => {
    setExpandedRow((prev) => (prev === contentId ? null : contentId));
  }, []);

  // Reset page on filter change
  useEffect(() => { setRawPage(1); }, [filters]);

  // ── Format helpers ─────────────────────────────────────────────────
  function formatDateRange(range) {
    if (!range) return '--';
    const f = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${f(range.min)} - ${f(range.max)}`;
  }

  function formatTime(iso) {
    return new Date(iso).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  // ── RENDER ─────────────────────────────────────────────────────────
  return (
    <>
      <motion.div
        variants={stagger} initial="hidden" animate="show"
        style={{ paddingRight: anomalyPanelOpen ? '400px' : 0, transition: 'padding-right 0.3s ease' }}
      >
        {/* Header */}
        <motion.div variants={fadeUp} style={{ marginBottom: '32px' }}>
          <h1 style={{
            fontFamily: 'var(--font-heading)', fontSize: '28px', fontWeight: 800,
            color: 'var(--text-primary)', marginBottom: '6px',
          }}>
            Streaming Logs
          </h1>
          <p style={{
            fontFamily: 'var(--font-mono)', fontSize: '13px',
            color: 'var(--text-muted)', letterSpacing: '0.02em',
          }}>
            Aggregated content analytics and anomaly detection
          </p>
        </motion.div>

        {/* ── Top Metrics Bar ───────────────────────────────────────── */}
        <motion.div variants={fadeUp} style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '16px',
          marginBottom: '28px',
        }}>
          {/* Total Plays */}
          <Card>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '16px' }}>
                Total Plays
              </span>
              <Activity size={18} color="var(--accent-teal)" strokeWidth={1.5} />
            </div>
            <SpringNumber value={totalPlays} color="var(--accent-teal)" />
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)', marginTop: '12px' }}>
              All content streams
            </div>
          </Card>

          {/* Unique Titles */}
          <Card>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '16px' }}>
                Unique Titles
              </span>
              <FileText size={18} color="var(--accent-purple)" strokeWidth={1.5} />
            </div>
            <SpringNumber value={uniqueTitles} color="var(--accent-purple)" />
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)', marginTop: '12px' }}>
              Distinct content IDs
            </div>
          </Card>

          {/* Countries Active */}
          <Card>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '16px' }}>
                Countries Active
              </span>
              <Globe size={18} color="var(--success)" strokeWidth={1.5} />
            </div>
            <SpringNumber value={countriesActive} color="var(--success)" />
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)', marginTop: '12px' }}>
              Streaming territories
            </div>
          </Card>

          {/* Anomalies Detected */}
          <Card>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '16px' }}>
                Anomalies Detected
              </span>
              <AlertTriangle
                size={18}
                color={anomalyCount > 100 ? 'var(--accent-red)' : anomalyCount > 0 ? 'var(--accent-amber)' : 'var(--text-muted)'}
                strokeWidth={1.5}
              />
            </div>
            <SpringNumber
              value={anomalyCount}
              color={anomalyCount > 100 ? 'var(--accent-red)' : anomalyCount > 0 ? 'var(--accent-amber)' : 'var(--text-muted)'}
            />
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)', marginTop: '12px' }}>
              {anomalyCount > 100 ? 'CRITICAL -- review required' : anomalyCount > 0 ? 'Flagged events' : 'All clear'}
            </div>
          </Card>
        </motion.div>

        {/* ── Filters ──────────────────────────────────────────────── */}
        <FilterBar filters={filters} onFiltersChange={setFilters} />

        {/* ── Content Aggregation Table ─────────────────────────────── */}
        <motion.div variants={fadeUp} style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          marginBottom: '28px',
        }}>
          {/* Table header row */}
          <div style={{
            padding: '10px 16px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Content Aggregation
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>
              {filteredAggregation.length} records
            </span>
          </div>

          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center' }}>
              <div className="logs-shimmer" style={{
                width: '200px', height: '16px', borderRadius: '2px', margin: '0 auto',
                background: 'linear-gradient(90deg, var(--bg-raised) 25%, var(--bg-card-hover) 50%, var(--bg-raised) 75%)',
                backgroundSize: '200% 100%',
              }} />
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    {['Content ID', 'Total Plays', 'Countries', 'Date Range', 'Status', ''].map((col) => (
                      <th key={col} style={{
                        fontFamily: 'var(--font-body)', fontSize: '11px', fontWeight: 500,
                        color: 'var(--text-muted)', padding: '10px 16px', textAlign: 'left',
                        textTransform: 'uppercase', letterSpacing: '0.04em',
                        whiteSpace: 'nowrap',
                      }}>
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredAggregation.map((row) => (
                    <React.Fragment key={row.content_id}>
                      <tr
                        onClick={() => toggleRow(row.content_id)}
                        style={{
                          borderBottom: '1px solid rgba(31,45,61,0.3)',
                          cursor: 'pointer', transition: 'background 0.1s ease',
                        }}
                        onMouseOver={(e) => { e.currentTarget.style.background = 'var(--bg-card-hover)'; }}
                        onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; }}
                      >
                        {/* Content ID */}
                        <td style={{
                          padding: '14px 16px', fontFamily: 'var(--font-mono)',
                          fontSize: '13px', color: 'var(--accent-teal)',
                          display: 'flex', alignItems: 'center', gap: '8px',
                        }}>
                          <span style={{
                            color: 'var(--text-muted)', transition: 'transform 0.15s ease',
                            transform: expandedRow === row.content_id ? 'rotate(90deg)' : 'rotate(0deg)',
                            display: 'inline-flex',
                          }}>
                            <ChevronRight size={14} />
                          </span>
                          {row.content_id}
                        </td>

                        {/* Total Plays */}
                        <td style={{ padding: '14px 16px' }}>
                          <InlineBar value={row.total_plays} max={maxPlays} />
                        </td>

                        {/* Countries */}
                        <td style={{ padding: '14px 16px', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-secondary)' }}>
                          {row.countries.slice(0, 5).join(', ')}
                          {row.countries.length > 5 && (
                            <span style={{ color: 'var(--text-muted)', marginLeft: '4px' }}>
                              +{row.countries.length - 5} more
                            </span>
                          )}
                        </td>

                        {/* Date Range */}
                        <td style={{ padding: '14px 16px', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                          {formatDateRange(row.date_range)}
                        </td>

                        {/* Anomaly Flag */}
                        <td style={{ padding: '14px 16px' }}>
                          <AnomalyBadge hasAnomaly={row.has_anomaly} types={row.anomaly_types} />
                        </td>

                        {/* Expand indicator */}
                        <td style={{ padding: '14px 16px', fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)' }}>
                          {expandedRow === row.content_id ? 'COLLAPSE' : 'EXPAND'}
                        </td>
                      </tr>

                      {/* Expanded row: country breakdown */}
                      {expandedRow === row.content_id && (
                        <tr>
                          <td colSpan={6} style={{ padding: 0 }}>
                            <AnimatePresence>
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                style={{ overflow: 'hidden' }}
                              >
                                <div style={{
                                  padding: '0 16px',
                                  background: 'var(--bg-raised)',
                                  borderLeft: '3px solid var(--accent-teal)',
                                }}>
                                  <CountryBreakdownChart contentId={row.content_id} />
                                </div>
                              </motion.div>
                            </AnimatePresence>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        {/* ── Raw Log Viewer (virtualized) ──────────────────────────── */}
        <motion.div variants={fadeUp} style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          marginBottom: '28px',
        }}>
          {/* Terminal header */}
          <div style={{
            padding: '10px 16px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '8px', height: '8px', borderRadius: '50%',
                background: 'var(--success)',
                boxShadow: '0 0 6px var(--success)',
                animation: 'logsPulse 2s infinite',
              }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-secondary)' }}>
                stream://logs/raw
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>
                {filteredRawLogs.length.toLocaleString()} total
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>
                pg {rawPage}/{totalRawPages}
              </span>
            </div>
          </div>

          {/* Column header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '70px 100px 110px 50px 50px 70px 50px',
            gap: '12px',
            padding: '8px 16px',
            borderBottom: '1px solid var(--border-subtle)',
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}>
            <span>TIME</span>
            <span>PLAY ID</span>
            <span>CONTENT</span>
            <span>CC</span>
            <span style={{ textAlign: 'right' }}>PLAYS</span>
            <span>TYPE</span>
            <span>DEV</span>
          </div>

          {/* Log rows -- paginated at 50 rows per page */}
          <div style={{ maxHeight: '420px', overflowY: 'auto' }}>
            {paginatedRawLogs.map((log, index) => {
              const typeColors = {
                premium: 'var(--accent-teal)',
                free: 'var(--text-secondary)',
                trial: 'var(--accent-amber)',
              };
              const devLabels = { mobile: 'MOB', desktop: 'DSK', tv: 'TV', tablet: 'TAB' };

              return (
                <div
                  key={log.play_id || index}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '70px 100px 110px 50px 50px 70px 50px',
                    gap: '12px',
                    padding: '0 16px',
                    height: '32px',
                    alignItems: 'center',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '12px',
                    borderBottom: '1px solid rgba(31,45,61,0.15)',
                    transition: 'background 0.08s ease',
                    cursor: 'default',
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.background = 'var(--bg-card-hover)'; }}
                  onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <span style={{ color: 'var(--text-muted)' }}>{formatTime(log.timestamp)}</span>
                  <span style={{ color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {log.play_id}
                  </span>
                  <span style={{ color: 'var(--accent-teal)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {log.content_id}
                  </span>
                  <span style={{ color: 'var(--text-secondary)' }}>{log.country}</span>
                  <span style={{ color: 'var(--text-primary)', textAlign: 'right' }}>{log.plays}x</span>
                  <span style={{ color: typeColors[log.user_type] || 'var(--text-secondary)' }}>{log.user_type}</span>
                  <span style={{ color: 'var(--text-muted)' }}>{devLabels[log.device] || log.device}</span>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 16px', borderTop: '1px solid var(--border-subtle)',
            fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-muted)',
          }}>
            <span>
              {((rawPage - 1) * RAW_PER_PAGE) + 1}--{Math.min(rawPage * RAW_PER_PAGE, filteredRawLogs.length)} of {filteredRawLogs.length.toLocaleString()}
            </span>
            <div style={{ display: 'flex', gap: '6px' }}>
              <PgButton disabled={rawPage <= 1} onClick={() => setRawPage((p) => p - 1)}>
                <ChevronLeft size={14} />
              </PgButton>
              <PgButton disabled={rawPage >= totalRawPages} onClick={() => setRawPage((p) => p + 1)}>
                <ChevronRight size={14} />
              </PgButton>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* ── Anomaly Panel + Toggle ──────────────────────────────────── */}
      <AnomalyToggle
        count={anomalyCount}
        isOpen={anomalyPanelOpen}
        onToggle={() => setAnomalyPanelOpen((p) => !p)}
      />
      <AnomalyPanel
        anomalies={anomalies}
        isOpen={anomalyPanelOpen}
        onToggle={() => setAnomalyPanelOpen(false)}
      />

      {/* ── Keyframe animations ─────────────────────────────────────── */}
      <style>{`
        @keyframes logsPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes anomalyBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @keyframes logsShimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .logs-shimmer {
          animation: logsShimmer 1.5s infinite ease-in-out;
        }
      `}</style>
    </>
  );
}

/* ── Small pagination button ──────────────────────────────────────── */
function PgButton({ children, disabled, onClick }) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: '28px', height: '28px',
        background: 'transparent',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-sm)',
        color: disabled ? 'var(--text-muted)' : 'var(--text-secondary)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        transition: 'all 0.1s ease',
      }}
      onMouseOver={(e) => {
        if (!disabled) {
          e.currentTarget.style.borderColor = 'var(--accent-teal)';
          e.currentTarget.style.color = 'var(--accent-teal)';
        }
      }}
      onMouseOut={(e) => {
        if (!disabled) {
          e.currentTarget.style.borderColor = 'var(--border-subtle)';
          e.currentTarget.style.color = 'var(--text-secondary)';
        }
      }}
    >
      {children}
    </button>
  );
}
