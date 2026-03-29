import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import {
  DollarSign, CreditCard, AlertTriangle, CheckCircle,
  ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
  Search, X, Clock, Target, TrendingUp, Zap, Download,
  Calendar, Filter, Shield, Globe
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  ReferenceLine, Area, ComposedChart, CartesianGrid
} from 'recharts';
import Card from '../components/ui/Card';
import DataTable from '../components/ui/DataTable';
import Badge from '../components/ui/Badge';
import MetricCard from '../components/ui/MetricCard';
import { exportToCSV } from '../utils/exportUtils';
import toast from 'react-hot-toast';
import Skeleton from '../components/ui/Skeleton';
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
function SpringNumber({ value, prefix = '', color, fontSize = '36px' }) {
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { damping: 30, stiffness: 100 });
  const display = useTransform(spring, (v) => {
    const num = Math.round(v);
    return `${prefix}${num.toLocaleString()}`;
  });

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
   MOCK DATA GENERATORS
   (Generate realistic data locally so the page works without Supabase)
   ═══════════════════════════════════════════════════════════════════════ */
const STUDIOS = ['HelixMedia', 'StellarArts', 'NovaCinema', 'OrbitSound', 'PrismStudios', 'NexusFilms', 'ApexRecords', 'ZenithBroadcast'];
const CONTENT_TYPES = ['Movie', 'Show', 'Album', 'Podcast'];

function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

function generateMockPayments(count = 200) {
  const payments = [];
  for (let i = 0; i < count; i++) {
    const contentNum = randInt(1, 500);
    const contentType = CONTENT_TYPES[contentNum % 4];
    const year = 2024;
    const month = randInt(1, 12);
    const day = randInt(1, 28);

    payments.push({
      payment_id: `PAY_${String(i + 1).padStart(6, '0')}`,
      content_id: `${contentType}_${String(contentNum).padStart(3, '0')}`,
      contract_id: `C${String(randInt(100, 999))}`,
      amount_paid: parseFloat((Math.random() * 5000 + 50).toFixed(2)),
      payment_date: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      studio: rand(STUDIOS),
    });
  }
  return payments.sort((a, b) => b.payment_date.localeCompare(a.payment_date));
}

function generateMockCalculations(contentIds) {
  const calcs = {};
  for (const cid of contentIds) {
    const totalPlays = randInt(5000, 200000);
    const threshold = 100000;
    const tierApplied = totalPlays >= threshold;
    const rate = tierApplied ? 0.026 : 0.035;
    const expected = parseFloat((totalPlays * rate).toFixed(2));

    calcs[cid] = {
      content_id: cid,
      contract_id: `C${String(randInt(100, 999))}`,
      total_plays: totalPlays,
      rate_applied: rate,
      tier_applied: tierApplied,
      expected_royalty: expected,
      calculation_steps: [
        `Fetched contract for ${cid}`,
        `Total plays in territory: ${totalPlays.toLocaleString()}`,
        tierApplied
          ? `Plays (${totalPlays.toLocaleString()}) exceed tier_threshold (${threshold.toLocaleString()}) -- applying tier rate $${rate.toFixed(4)}`
          : `Plays (${totalPlays.toLocaleString()}) below tier_threshold (${threshold.toLocaleString()}) -- applying standard rate $${rate.toFixed(4)}`,
        `Expected royalty: ${totalPlays.toLocaleString()} x $${rate.toFixed(4)} = $${expected.toLocaleString()}`,
      ],
    };
  }
  return calcs;
}

function generateMockTimeline(contentId, payments) {
  const contentPayments = payments
    .filter((p) => p.content_id === contentId)
    .sort((a, b) => a.payment_date.localeCompare(b.payment_date));

  let cumulative = 0;
  return contentPayments.map((p) => {
    cumulative += p.amount_paid;
    return {
      payment_id: p.payment_id,
      payment_date: p.payment_date,
      amount_paid: p.amount_paid,
      cumulative_paid: parseFloat(cumulative.toFixed(2)),
    };
  });
}

function generateMockMissing() {
  const missing = [];
  for (let i = 0; i < randInt(3, 8); i++) {
    const contentType = CONTENT_TYPES[i % 4];
    const num = randInt(400, 500);
    missing.push({
      content_id: `${contentType}_${String(num).padStart(3, '0')}`,
      contract_id: `C${String(randInt(100, 999))}`,
      studio: rand(STUDIOS),
      start_date: '2024-01-01',
      end_date: '2024-12-31',
    });
  }
  return missing;
}

/* ═══════════════════════════════════════════════════════════════════════
   STEP ICON MAP
   ═══════════════════════════════════════════════════════════════════════ */
const STEP_ICONS = [
  <Zap size={12} color="var(--accent-teal)" />,
  <Target size={12} color="var(--accent-purple)" />,
  <TrendingUp size={12} color="var(--accent-amber)" />,
  <DollarSign size={12} color="var(--success)" />,
];

/* ═══════════════════════════════════════════════════════════════════════
   CUSTOM RECHARTS TOOLTIP
   ═══════════════════════════════════════════════════════════════════════ */
function TimelineTooltip({ active, payload, label }) {
  if (!active || !payload || payload.length === 0) return null;
  const d = payload[0]?.payload;
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-subtle)',
      borderRadius: '4px',
      padding: '10px 14px',
      fontFamily: 'var(--font-mono)',
      fontSize: '12px',
    }}>
      <div style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>{label}</div>
      {d && (
        <>
          <div style={{ color: 'var(--accent-teal)' }}>
            Paid: ${d.amount_paid?.toLocaleString()}
          </div>
          <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
            Cumulative: ${d.cumulative_paid?.toLocaleString()}
          </div>
        </>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   PAYMENT TIMELINE CHART (right panel)
   ═══════════════════════════════════════════════════════════════════════ */
function PaymentTimelineChart({ timeline, expectedAmount }) {
  if (!timeline || timeline.length === 0) {
    return (
      <div style={{
        padding: '40px 20px',
        textAlign: 'center',
        fontFamily: 'var(--font-mono)',
        fontSize: '12px',
        color: 'var(--text-muted)',
      }}>
        No payment history for this content
      </div>
    );
  }

  const maxCumulative = Math.max(...timeline.map((t) => t.cumulative_paid), expectedAmount || 0);
  const finalCumulative = timeline[timeline.length - 1]?.cumulative_paid || 0;
  const isUnderpaid = expectedAmount && finalCumulative < expectedAmount;
  const isOverpaid = expectedAmount && finalCumulative > expectedAmount;

  return (
    <div>
      {/* Status indicator */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        marginBottom: '16px', padding: '8px 12px',
        background: isUnderpaid ? 'rgba(245,166,35,0.06)' : isOverpaid ? 'rgba(255,77,77,0.06)' : 'rgba(34,197,94,0.06)',
        border: `1px solid ${isUnderpaid ? 'rgba(245,166,35,0.2)' : isOverpaid ? 'rgba(255,77,77,0.2)' : 'rgba(34,197,94,0.2)'}`,
        borderRadius: 'var(--radius-sm)',
      }}>
        <div style={{
          width: '6px', height: '6px', borderRadius: '50%',
          background: isUnderpaid ? 'var(--accent-amber)' : isOverpaid ? 'var(--accent-red)' : 'var(--success)',
        }} />
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: '11px',
          color: isUnderpaid ? 'var(--accent-amber)' : isOverpaid ? 'var(--accent-red)' : 'var(--success)',
        }}>
          {isUnderpaid
            ? `UNDERPAID -- shortfall: $${(expectedAmount - finalCumulative).toLocaleString()}`
            : isOverpaid
              ? `OVERPAID -- excess: $${(finalCumulative - expectedAmount).toLocaleString()}`
              : 'RECONCILED'}
        </span>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <ComposedChart data={timeline} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(31,45,61,0.3)" />
          <XAxis
            dataKey="payment_date"
            tick={{ fontSize: 10, fontFamily: 'var(--font-mono)', fill: 'var(--text-muted)' }}
            axisLine={{ stroke: 'var(--border-subtle)' }}
            tickLine={false}
            tickFormatter={(v) => {
              const d = new Date(v);
              return `${d.toLocaleString('en', { month: 'short' })} ${d.getDate()}`;
            }}
          />
          <YAxis
            tick={{ fontSize: 10, fontFamily: 'var(--font-mono)', fill: 'var(--text-muted)' }}
            axisLine={{ stroke: 'var(--border-subtle)' }}
            tickLine={false}
            tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
            domain={[0, Math.ceil(maxCumulative * 1.15)]}
          />
          <Tooltip content={<TimelineTooltip />} />

          {/* Expected line */}
          {expectedAmount > 0 && (
            <ReferenceLine
              y={expectedAmount}
              stroke="var(--accent-amber)"
              strokeDasharray="6 4"
              strokeWidth={1.5}
              label={{
                value: `Expected: $${expectedAmount.toLocaleString()}`,
                position: 'right',
                style: {
                  fontSize: 10,
                  fontFamily: 'var(--font-mono)',
                  fill: 'var(--accent-amber)',
                },
              }}
            />
          )}

          {/* Cumulative area */}
          <Area
            type="monotone"
            dataKey="cumulative_paid"
            stroke="none"
            fill={isUnderpaid ? 'rgba(245,166,35,0.08)' : isOverpaid ? 'rgba(255,77,77,0.08)' : 'rgba(0,217,192,0.08)'}
          />

          {/* Cumulative line */}
          <Line
            type="monotone"
            dataKey="cumulative_paid"
            stroke="var(--accent-teal)"
            strokeWidth={2}
            dot={{
              r: 4,
              fill: 'var(--bg-card)',
              stroke: 'var(--accent-teal)',
              strokeWidth: 2,
            }}
            activeDot={{
              r: 6,
              fill: 'var(--accent-teal)',
              stroke: 'var(--bg-void)',
              strokeWidth: 2,
            }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   CALCULATION BREAKDOWN (terminal-style)
   ═══════════════════════════════════════════════════════════════════════ */
function CalculationBreakdown({ calculation }) {
  if (!calculation) return null;

  return (
    <div style={{
      background: 'var(--bg-void)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-md)',
      overflow: 'hidden',
    }}>
      {/* Terminal header bar */}
      <div style={{
        padding: '8px 14px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex', alignItems: 'center', gap: '10px',
      }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#FF605C' }} />
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#FFBD44' }} />
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00CA4E' }} />
        </div>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: '11px',
          color: 'var(--text-muted)',
        }}>
          royalty-calc://{calculation.content_id}
        </span>
      </div>

      {/* Steps */}
      <div style={{ padding: '14px 16px' }}>
        {(calculation.calculation_steps || []).map((step, i) => (
          <div
            key={i}
            style={{
              display: 'flex', alignItems: 'flex-start', gap: '10px',
              padding: '6px 0',
              borderBottom: i < (calculation.calculation_steps.length - 1)
                ? '1px solid rgba(31,45,61,0.2)' : 'none',
            }}
          >
            <div style={{
              marginTop: '2px',
              flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '20px', height: '20px',
              borderRadius: '3px',
              background: 'rgba(0,217,192,0.06)',
              border: '1px solid rgba(0,217,192,0.15)',
            }}>
              {STEP_ICONS[i % STEP_ICONS.length]}
            </div>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              lineHeight: '1.5',
              color: 'var(--text-secondary)',
            }}>
              {highlightValues(step)}
            </span>
          </div>
        ))}

        {/* Summary line */}
        <div style={{
          marginTop: '12px', paddingTop: '10px',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: '11px',
            color: 'var(--text-muted)',
          }}>
            {calculation.tier_applied ? 'TIER RATE APPLIED' : 'STANDARD RATE'}
          </span>
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: 700,
            color: 'var(--accent-teal)',
          }}>
            ${calculation.expected_royalty?.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}

/** Highlight $ amounts and numbers in teal within a step string */
function highlightValues(text) {
  const parts = text.split(/(\$[\d,.]+|[\d,]+(?:\.\d+)?)/g);
  return parts.map((part, i) => {
    if (/^\$/.test(part)) {
      return <span key={i} style={{ color: 'var(--accent-teal)', fontWeight: 600 }}>{part}</span>;
    }
    if (/^[\d,]+(\.\d+)?$/.test(part) && part.length > 2) {
      return <span key={i} style={{ color: 'var(--text-primary)' }}>{part}</span>;
    }
    return <span key={i}>{part}</span>;
  });
}

/* ═══════════════════════════════════════════════════════════════════════
   MISSING PAYMENTS BANNER
   ═══════════════════════════════════════════════════════════════════════ */
function MissingPaymentsBanner({ missing, onSelectContent }) {
  const [expanded, setExpanded] = useState(false);

  if (!missing || missing.length === 0) return null;

  return (
    <motion.div
      variants={fadeUp}
      style={{
        marginBottom: '20px',
        background: 'rgba(245,166,35,0.06)',
        border: '1px solid rgba(245,166,35,0.2)',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
      }}
    >
      <button
        onClick={() => setExpanded((p) => !p)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          width: '100%', padding: '12px 16px',
          background: 'transparent', border: 'none',
          cursor: 'pointer', color: 'var(--accent-amber)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <AlertTriangle size={16} />
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 600,
          }}>
            {missing.length} licensed title{missing.length > 1 ? 's' : ''} have no recorded payments
          </span>
        </div>
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{
              padding: '0 16px 14px',
              display: 'flex', flexWrap: 'wrap', gap: '6px',
            }}>
              {missing.map((m) => (
                <button
                  key={m.content_id}
                  onClick={() => onSelectContent(m.content_id)}
                  style={{
                    fontFamily: 'var(--font-mono)', fontSize: '11px',
                    padding: '4px 10px', borderRadius: '2px',
                    border: '1px solid rgba(245,166,35,0.25)',
                    background: 'rgba(245,166,35,0.05)',
                    color: 'var(--accent-amber)',
                    cursor: 'pointer', transition: 'all 0.12s ease',
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(245,166,35,0.12)'; }}
                  onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(245,166,35,0.05)'; }}
                >
                  {m.content_id}
                  <span style={{ color: 'var(--text-muted)', marginLeft: '6px' }}>
                    ({m.studio})
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   MAIN: PaymentsPage
   ═══════════════════════════════════════════════════════════════════════ */
export default function PaymentsPage() {
  // ── State ──────────────────────────────────────────────────────────
  const [payments, setPayments] = useState([]);
  const [calculations, setCalculations] = useState({});
  const [missingPayments, setMissingPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedContentId, setSelectedContentId] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: 'payment_date', dir: 'desc' });
  const [search, setSearch] = useState('');
  const [studioFilter, setStudioFilter] = useState('all');
  const [page, setPage] = useState(1);
  const PER_PAGE = 15;

  // ── Fetch data ─────────────────────────────────────────────────────
  const [useMock, setUseMock] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        // Quick check: does payment_ledger have any rows?
        const { count, error: countErr } = await supabase
          .from('payment_ledger')
          .select('payment_id', { count: 'exact', head: true });

        if (countErr || !count || count === 0) {
          // No payment data in Supabase -- use mock immediately
          throw new Error('Empty payment_ledger');
        }

        // Supabase has data -- load real data
        const [{ ledgerAgent }, { royaltyCalculatorAgent }] = await Promise.all([
          import('../agents/ledgerAgent'),
          import('../agents/royaltyCalculatorAgent'),
        ]);

        const [allPaymentsRes, missingRes, calcsRes] = await Promise.all([
          ledgerAgent.getAllPayments({ page: 1, perPage: 5000 }),
          ledgerAgent.getMissingPayments(),
          royaltyCalculatorAgent.calculateAll(),
        ]);

        const enrichedPayments = (allPaymentsRes.data || []).map((p) => {
          const studio = p.contracts?.studio || p.studio || 'Unknown';
          return { ...p, studio };
        });

        setPayments(enrichedPayments);
        setMissingPayments(missingRes || []);

        const calcMap = {};
        for (const c of (calcsRes || [])) {
          calcMap[c.content_id] = c;
        }
        setCalculations(calcMap);
        setUseMock(false);

      } catch {
        // Fallback to mock data
        const mockData = generateMockPayments(200);
        setPayments(mockData);
        setMissingPayments(generateMockMissing());

        const contentIds = [...new Set(mockData.map((p) => p.content_id))];
        setCalculations(generateMockCalculations(contentIds));
        setUseMock(true);
      }
      setLoading(false);
    }
    load();
  }, []);

  // ── Load timeline when content is selected ─────────────────────────
  useEffect(() => {
    if (!selectedContentId) {
      setTimeline([]);
      return;
    }

    async function loadTimeline() {
      if (useMock) {
        setTimeline(generateMockTimeline(selectedContentId, payments));
        return;
      }
      try {
        const { ledgerAgent } = await import('../agents/ledgerAgent');
        const tl = await ledgerAgent.getPaymentTimeline(selectedContentId);
        setTimeline(tl || []);
      } catch {
        setTimeline(generateMockTimeline(selectedContentId, payments));
      }
    }
    loadTimeline();
  }, [selectedContentId, payments, useMock]);

  // ── Computed: studios for filter ───────────────────────────────────
  const studios = useMemo(() => {
    const set = new Set(payments.map((p) => p.studio).filter(Boolean));
    return ['all', ...Array.from(set).sort()];
  }, [payments]);

  // ── Computed: filtered + sorted + paginated ────────────────────────
  const filteredPayments = useMemo(() => {
    let result = payments;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter((p) =>
        p.payment_id?.toLowerCase().includes(q) ||
        p.content_id?.toLowerCase().includes(q) ||
        p.contract_id?.toLowerCase().includes(q)
      );
    }

    if (studioFilter !== 'all') {
      result = result.filter((p) => p.studio === studioFilter);
    }

    // Sort
    result = [...result].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      if (aVal < bVal) return sortConfig.dir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.dir === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [payments, search, studioFilter, sortConfig]);

  const totalPages = Math.ceil(filteredPayments.length / PER_PAGE);
  const pagedPayments = filteredPayments.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  // ── Computed: metrics ──────────────────────────────────────────────
  const totalPaid = useMemo(() => payments.reduce((s, p) => s + (p.amount_paid || 0), 0), [payments]);
  const totalExpected = useMemo(() => {
    return Object.values(calculations).reduce((s, c) => s + (c.expected_royalty || 0), 0);
  }, [calculations]);
  const leakage = useMemo(() => Math.max(0, totalExpected - totalPaid), [totalExpected, totalPaid]);
  const uniqueContentIds = useMemo(() => new Set(payments.map((p) => p.content_id)).size, [payments]);

  // ── Underpaid content set ──────────────────────────────────────────
  const underpaidContents = useMemo(() => {
    const set = new Set();
    for (const [cid, calc] of Object.entries(calculations)) {
      const paid = payments
        .filter((p) => p.content_id === cid)
        .reduce((s, p) => s + p.amount_paid, 0);
      if (paid < calc.expected_royalty * 0.95) {
        set.add(cid);
      }
    }
    return set;
  }, [calculations, payments]);

  // ── Handlers ───────────────────────────────────────────────────────
  const handleSort = useCallback((key) => {
    setSortConfig((prev) => ({
      key,
      dir: prev.key === key && prev.dir === 'asc' ? 'desc' : 'asc',
    }));
  }, []);

  const handleSelectContent = useCallback((contentId) => {
    setSelectedContentId(contentId);
  }, []);

  const handleExportCSV = useCallback(() => {
    if (!filteredPayments || filteredPayments.length === 0) return;

    // Build CSV Header
    const headers = ['Payment ID', 'Content', 'Contract', 'Studio', 'Amount Paid', 'Payment Date'];
    
    // Convert data to CSV rows
    const rows = filteredPayments.map(p => 
      [
        p.payment_id,
        p.content_id,
        p.contract_id,
        p.studio || 'Unknown',
        p.amount_paid.toFixed(2),
        p.payment_date
      ].join(',')
    );

    const csvContent = "data:text/csv;charset=utf-8," + headers.join(',') + "\n" + rows.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `payment_ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [filteredPayments]);

  // Reset page on filter change
  useEffect(() => { setPage(1); }, [search, studioFilter]);

  const handleExport = () => {
    exportToCSV(filteredPayments, 'payments_ledger_export');
    toast.success('Ledger exported to CSV');
  };

  useEffect(() => {
    const onGlobalExport = () => handleExport();
    window.addEventListener('export:csv', onGlobalExport);
    return () => window.removeEventListener('export:csv', onGlobalExport);
  }, [filteredPayments]);

  // ── Selected content calculation ───────────────────────────────────
  const selectedCalc = selectedContentId ? calculations[selectedContentId] : null;

  if (loading) {
    return (
      <motion.div variants={stagger} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        <Skeleton height="80px" borderRadius="var(--radius-md)" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          <Skeleton height="100px" />
          <Skeleton height="100px" />
          <Skeleton height="100px" />
          <Skeleton height="100px" />
        </div>
        <Skeleton height="400px" borderRadius="var(--radius-md)" />
      </motion.div>
    );
  }

  // ── RENDER ─────────────────────────────────────────────────────────
  return (
    <motion.div variants={stagger} initial="hidden" animate="show">
      {/* Header */}
      <motion.div variants={fadeUp} style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{
            fontFamily: 'var(--font-heading)', fontSize: '28px', fontWeight: 800,
            color: 'var(--text-primary)', marginBottom: '6px',
          }}>
            Payment Ledger
          </h1>
          <p style={{
            fontFamily: 'var(--font-mono)', fontSize: '13px',
            color: 'var(--text-muted)', letterSpacing: '0.02em',
          }}>
            Reconciliation engine -- royalty calculations vs actual payments
          </p>
        </div>
        <button
          onClick={handleExport}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px',
            background: 'var(--accent-teal)', color: 'var(--bg-void)', border: 'none',
            borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-mono)', fontSize: '12px',
            fontWeight: 700, boxShadow: '0 0 15px rgba(0,217,192,0.3)', transition: 'all 0.2s'
          }}
          onMouseOver={e => e.currentTarget.style.transform = 'translateY(-1px)'}
          onMouseOut={e => e.currentTarget.style.transform = 'none'}
        >
          <Download size={14} /> EXPORT CSV
        </button>
      </motion.div>

      {/* Missing payments banner */}
      <MissingPaymentsBanner
        missing={missingPayments}
        onSelectContent={handleSelectContent}
      />

      {/* ── Top Metrics ─────────────────────────────────────────────── */}
      <motion.div variants={fadeUp} style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '16px',
        marginBottom: '28px',
      }}>
        <Card>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Total Expected
            </span>
            <DollarSign size={18} color="var(--accent-teal)" strokeWidth={1.5} />
          </div>
          <SpringNumber value={totalExpected} prefix="$" color="var(--accent-teal)" />
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)', marginTop: '12px' }}>
            Owed per contracts
          </div>
        </Card>

        <Card>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Total Paid
            </span>
            <CreditCard size={18} color="var(--accent-purple)" strokeWidth={1.5} />
          </div>
          <SpringNumber value={totalPaid} prefix="$" color="var(--accent-purple)" />
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)', marginTop: '12px' }}>
            {payments.length.toLocaleString()} payment records
          </div>
        </Card>

        <Card>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Revenue Leakage
            </span>
            <AlertTriangle size={18} color="var(--danger)" strokeWidth={1.5} />
          </div>
          <SpringNumber value={leakage} prefix="$" color="var(--danger)" />
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)', marginTop: '12px' }}>
            {underpaidContents.size} underpaid titles
          </div>
        </Card>

        <Card>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Titles Tracked
            </span>
            <CheckCircle size={18} color="var(--success)" strokeWidth={1.5} />
          </div>
          <SpringNumber value={uniqueContentIds} color="var(--success)" />
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)', marginTop: '12px' }}>
            Distinct content IDs
          </div>
        </Card>
      </motion.div>

      {/* ── Split panel: Ledger + Detail ─────────────────────────────── */}
      <motion.div variants={fadeUp} style={{
        display: 'grid',
        gridTemplateColumns: selectedContentId ? '60% 40%' : '1fr',
        gap: '20px',
        alignItems: 'start',
      }}>
        {/* LEFT: Payment Ledger Table */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
        }}>
          {/* Table header bar */}
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexWrap: 'wrap', gap: '10px',
          }}>
            <h2 style={{
              fontFamily: 'var(--font-heading)', fontSize: '15px',
              fontWeight: 700, color: 'var(--text-primary)',
            }}>
              Payment Records
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* Search */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '5px 10px',
                background: 'var(--bg-raised)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
              }}>
                <Search size={12} color="var(--text-muted)" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search IDs..."
                  style={{
                    background: 'transparent', border: 'none', outline: 'none',
                    fontFamily: 'var(--font-mono)', fontSize: '11px',
                    color: 'var(--text-primary)', width: '120px',
                  }}
                />
                {search && (
                  <button onClick={() => setSearch('')} style={{
                    background: 'transparent', border: 'none',
                    color: 'var(--text-muted)', cursor: 'pointer',
                    display: 'flex', padding: 0,
                  }}>
                    <X size={12} />
                  </button>
                )}
              </div>

              {/* Studio filter */}
              <select
                value={studioFilter}
                onChange={(e) => setStudioFilter(e.target.value)}
                style={{
                  fontFamily: 'var(--font-mono)', fontSize: '11px',
                  padding: '5px 8px',
                  background: 'var(--bg-raised)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                }}
              >
                {studios.map((s) => (
                  <option key={s} value={s}>{s === 'all' ? 'All Studios' : s}</option>
                ))}
              </select>

              <button
                onClick={handleExportCSV}
                title="Export CSV"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'var(--bg-raised)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--accent-teal)',
                  padding: '5px 8px',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(0, 217, 192, 0.1)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'var(--bg-raised)'}
              >
                <Download size={14} />
              </button>

              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: '11px',
                color: 'var(--text-muted)', whiteSpace: 'nowrap',
              }}>
                {filteredPayments.length} records
              </span>
            </div>
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  {[
                    { key: 'payment_id', label: 'Payment ID' },
                    { key: 'content_id', label: 'Content' },
                    { key: 'contract_id', label: 'Contract' },
                    { key: 'amount_paid', label: 'Amount Paid', align: 'right' },
                    { key: 'payment_date', label: 'Payment Date' },
                  ].map((col) => (
                    <th
                      key={col.key}
                      onClick={() => handleSort(col.key)}
                      style={{
                        fontFamily: 'var(--font-mono)', fontSize: '10px',
                        fontWeight: 500, color: 'var(--text-muted)',
                        padding: '10px 14px', cursor: 'pointer',
                        textAlign: col.align || 'left',
                        textTransform: 'uppercase', letterSpacing: '0.06em',
                        userSelect: 'none', whiteSpace: 'nowrap',
                      }}
                    >
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: '4px',
                        justifyContent: col.align === 'right' ? 'flex-end' : 'flex-start',
                      }}>
                        {col.label}
                        {sortConfig.key === col.key && (
                          <span style={{ color: 'var(--accent-teal)' }}>
                            {sortConfig.dir === 'asc' ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  // Shimmer skeleton
                  [...Array(8)].map((_, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(31,45,61,0.3)' }}>
                      {[...Array(5)].map((_, j) => (
                        <td key={j} style={{ padding: '12px 14px' }}>
                          <div style={{
                            height: '14px',
                            width: `${40 + Math.random() * 40}%`,
                            borderRadius: '2px',
                            background: 'linear-gradient(90deg, var(--bg-raised) 25%, var(--bg-card) 50%, var(--bg-raised) 75%)',
                            backgroundSize: '200% 100%',
                            animation: 'payShimmer 1.5s infinite ease-in-out',
                          }} />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : pagedPayments.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{
                      padding: '40px', textAlign: 'center',
                      fontFamily: 'var(--font-mono)', fontSize: '13px',
                      color: 'var(--text-muted)',
                    }}>
                      No payment records found.
                    </td>
                  </tr>
                ) : (
                  pagedPayments.map((row, idx) => {
                    const isUnderpaid = underpaidContents.has(row.content_id);
                    const isSelected = selectedContentId === row.content_id;

                    return (
                      <motion.tr
                        key={row.payment_id || idx}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.015, duration: 0.2 }}
                        onClick={() => handleSelectContent(row.content_id)}
                        style={{
                          borderBottom: '1px solid rgba(31,45,61,0.3)',
                          cursor: 'pointer',
                          transition: 'background-color 0.1s ease',
                          borderLeft: isSelected ? '3px solid var(--accent-teal)' : '3px solid transparent',
                          background: isSelected ? 'rgba(0,217,192,0.03)' : 'transparent',
                        }}
                        onMouseOver={(e) => {
                          if (!isSelected) e.currentTarget.style.background = 'var(--bg-card-hover)';
                        }}
                        onMouseOut={(e) => {
                          if (!isSelected) e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        {/* Payment ID */}
                        <td style={{
                          padding: '11px 14px',
                          fontFamily: 'var(--font-mono)', fontSize: '12px',
                          color: 'var(--text-secondary)',
                        }}>
                          {row.payment_id}
                        </td>

                        {/* Content */}
                        <td style={{
                          padding: '11px 14px',
                          fontFamily: 'var(--font-mono)', fontSize: '12px',
                          color: 'var(--accent-teal)',
                        }}>
                          {row.content_id}
                        </td>

                        {/* Contract */}
                        <td style={{
                          padding: '11px 14px',
                          fontFamily: 'var(--font-mono)', fontSize: '12px',
                          color: 'var(--text-secondary)',
                        }}>
                          {row.contract_id}
                        </td>

                        {/* Amount Paid */}
                        <td style={{
                          padding: '11px 14px',
                          fontFamily: 'var(--font-mono)', fontSize: '13px',
                          fontWeight: 600,
                          textAlign: 'right',
                          color: isUnderpaid ? 'var(--accent-red)' : 'var(--text-primary)',
                        }}>
                          ${row.amount_paid?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          {isUnderpaid && (
                            <span style={{
                              marginLeft: '6px', fontSize: '9px',
                              padding: '1px 5px', borderRadius: '2px',
                              background: 'rgba(255,77,77,0.1)',
                              border: '1px solid rgba(255,77,77,0.25)',
                              color: 'var(--accent-red)',
                              verticalAlign: 'super',
                            }}>
                              UNDERPAID
                            </span>
                          )}
                        </td>

                        {/* Payment Date */}
                        <td style={{
                          padding: '11px 14px',
                          fontFamily: 'var(--font-mono)', fontSize: '12px',
                          color: 'var(--text-muted)',
                        }}>
                          {row.payment_date}
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && filteredPayments.length > PER_PAGE && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 14px',
              borderTop: '1px solid var(--border-subtle)',
              fontFamily: 'var(--font-mono)', fontSize: '11px',
              color: 'var(--text-muted)',
            }}>
              <span>
                {((page - 1) * PER_PAGE) + 1}--{Math.min(page * PER_PAGE, filteredPayments.length)} of {filteredPayments.length}
              </span>
              <div style={{ display: 'flex', gap: '6px' }}>
                <PaginationBtn disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  <ChevronLeft size={13} />
                </PaginationBtn>
                <PaginationBtn disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                  <ChevronRight size={13} />
                </PaginationBtn>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: Payment Timeline + Calculation Breakdown */}
        {selectedContentId && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
          >
            {/* Content header */}
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
            }}>
              <div style={{
                padding: '14px 16px',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Clock size={14} color="var(--text-muted)" />
                  <h3 style={{
                    fontFamily: 'var(--font-heading)', fontSize: '14px',
                    fontWeight: 700, color: 'var(--text-primary)',
                  }}>
                    Payment Timeline
                  </h3>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontSize: '12px',
                    color: 'var(--accent-teal)', fontWeight: 600,
                  }}>
                    {selectedContentId}
                  </span>
                  <button
                    onClick={() => setSelectedContentId(null)}
                    style={{
                      background: 'transparent', border: 'none',
                      color: 'var(--text-muted)', cursor: 'pointer',
                      display: 'flex', padding: '2px',
                    }}
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>

              <div style={{ padding: '16px' }}>
                <PaymentTimelineChart
                  timeline={timeline}
                  expectedAmount={selectedCalc?.expected_royalty || 0}
                />
              </div>
            </div>

            {/* Calculation Breakdown */}
            {selectedCalc && (
              <div>
                <div style={{
                  fontFamily: 'var(--font-mono)', fontSize: '10px',
                  color: 'var(--text-muted)', textTransform: 'uppercase',
                  letterSpacing: '0.06em', marginBottom: '8px',
                }}>
                  Calculation Breakdown
                </div>
                <CalculationBreakdown calculation={selectedCalc} />
              </div>
            )}

            {/* Quick stats for selected content */}
            {selectedCalc && (
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr',
                gap: '10px',
              }}>
                <div style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '14px',
                }}>
                  <div style={{
                    fontFamily: 'var(--font-mono)', fontSize: '10px',
                    color: 'var(--text-muted)', textTransform: 'uppercase',
                    marginBottom: '6px',
                  }}>
                    Total Plays
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-mono)', fontSize: '20px',
                    fontWeight: 700, color: 'var(--text-primary)',
                  }}>
                    {selectedCalc.total_plays?.toLocaleString()}
                  </div>
                </div>
                <div style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '14px',
                }}>
                  <div style={{
                    fontFamily: 'var(--font-mono)', fontSize: '10px',
                    color: 'var(--text-muted)', textTransform: 'uppercase',
                    marginBottom: '6px',
                  }}>
                    Rate Applied
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-mono)', fontSize: '20px',
                    fontWeight: 700, color: selectedCalc.tier_applied ? 'var(--accent-amber)' : 'var(--text-primary)',
                  }}>
                    ${selectedCalc.rate_applied?.toFixed(4)}
                    {selectedCalc.tier_applied && (
                      <span style={{
                        fontSize: '9px', marginLeft: '6px',
                        padding: '2px 6px', borderRadius: '2px',
                        background: 'rgba(245,166,35,0.1)',
                        border: '1px solid rgba(245,166,35,0.2)',
                        color: 'var(--accent-amber)',
                        verticalAlign: 'super',
                      }}>
                        TIER
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </motion.div>

      {/* Shimmer animation CSS */}
      <style>{`
        @keyframes payShimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   PAGINATION BUTTON
   ═══════════════════════════════════════════════════════════════════════ */
function PaginationBtn({ children, disabled, onClick }) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: '26px', height: '26px',
        background: 'transparent',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-sm)',
        color: disabled ? 'var(--text-muted)' : 'var(--text-secondary)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.1s ease',
        opacity: disabled ? 0.4 : 1,
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
