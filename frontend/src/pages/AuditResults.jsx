import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, CheckCircle, XCircle, AlertTriangle, TrendingDown } from 'lucide-react';
import DataTable from '../components/ui/DataTable';
import Badge from '../components/ui/Badge';
import MetricCard from '../components/ui/MetricCard';
import Card from '../components/ui/Card';

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } }
};
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } }
};

const STUDIOS = ['HelixMedia', 'StellarArts', 'NovaCinema', 'OrbitSound', 'PrismStudios', 'NexusFilms', 'ApexRecords', 'ZenithBroadcast'];

function generateAuditResults() {
  const results = [];
  const checks = [
    'Rate Verification', 'Territory Compliance', 'Tier Threshold',
    'Payment Reconciliation', 'Contract Validity', 'Minimum Guarantee',
    'Usage Count Match', 'Currency Conversion'
  ];

  for (let i = 0; i < 40; i++) {
    const contractNum = ((i * 7 + 1) % 40) + 1;
    const contentType = ['Movie', 'Show', 'Album', 'Podcast'][i % 4];
    const check = checks[i % checks.length];
    const totalPlays = 5000 + (i * 1337 % 95000);
    const expectedAmount = Math.round(totalPlays * (0.01 + (i * 3 % 7) / 100));
    let actualAmount, finding;

    if (i % 5 === 0) {
      actualAmount = Math.round(expectedAmount * 0.78);
      finding = 'underpayment';
    } else if (i % 9 === 0) {
      actualAmount = Math.round(expectedAmount * 1.12);
      finding = 'overpayment';
    } else if (i % 15 === 0) {
      actualAmount = 0;
      finding = 'missing';
    } else {
      actualAmount = expectedAmount;
      finding = 'clean';
    }

    const variance = expectedAmount > 0 ? Math.round((actualAmount - expectedAmount) / expectedAmount * 100) : -100;

    results.push({
      id: String(i + 1),
      audit_id: `AUD-${String(i + 1).padStart(5, '0')}`,
      contract_id: `CTR-${String(contractNum).padStart(4, '0')}`,
      content_id: `${contentType}_${String(contractNum).padStart(3, '0')}`,
      studio: STUDIOS[i % STUDIOS.length],
      check_type: check,
      total_plays: totalPlays,
      expected: expectedAmount,
      actual: actualAmount,
      variance,
      finding,
      timestamp: new Date(2024, i % 12, 1 + (i % 28)).toISOString()
    });
  }
  return results;
}

const mockResults = generateAuditResults();

const columns = [
  { key: 'audit_id', label: 'Audit ID' },
  { key: 'contract_id', label: 'Contract' },
  { key: 'studio', label: 'Studio' },
  { key: 'check_type', label: 'Check' },
  {
    key: 'total_plays', label: 'Plays', align: 'right',
    render: (v) => v.toLocaleString()
  },
  {
    key: 'expected', label: 'Expected', align: 'right',
    render: (v) => `$${v.toLocaleString()}`
  },
  {
    key: 'actual', label: 'Actual', align: 'right',
    render: (v) => `$${v.toLocaleString()}`
  },
  {
    key: 'variance', label: 'Var%', align: 'right',
    render: (v) => {
      const color = v < -5 ? 'var(--danger)' : v > 5 ? 'var(--accent-amber)' : 'var(--text-muted)';
      const prefix = v > 0 ? '+' : '';
      return <span style={{ color, fontFamily: 'var(--font-mono)' }}>{v === 0 ? '--' : `${prefix}${v}%`}</span>;
    }
  },
  {
    key: 'finding', label: 'Finding',
    render: (v) => <Badge type={v}>{v}</Badge>
  }
];

export default function AuditResults() {
  const [activeTab, setActiveTab] = useState('all');
  const [page, setPage] = useState(1);
  const perPage = 10;

  const filtered = activeTab === 'all' ? mockResults : mockResults.filter(r => r.finding === activeTab);
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  const cleanCount = mockResults.filter(r => r.finding === 'clean').length;
  const flaggedCount = mockResults.filter(r => r.finding !== 'clean').length;
  const totalVariance = mockResults.reduce((s, r) => s + Math.max(0, r.expected - r.actual), 0);
  const accuracy = Math.round(cleanCount / mockResults.length * 100);

  const tabs = ['all', 'clean', 'underpayment', 'overpayment', 'missing'];

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
          Audit Results
        </h1>
        <p style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '13px',
          color: 'var(--text-muted)',
          letterSpacing: '0.02em'
        }}>
          Reconciliation engine completed -- {mockResults.length} checks executed
        </p>
      </motion.div>

      {/* Metrics */}
      <motion.div variants={fadeUp} style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <MetricCard label="Checks Passed" value={cleanCount} color="var(--success)" icon={CheckCircle} sublabel={`${accuracy}% accuracy rate`} />
        <MetricCard label="Findings" value={flaggedCount} color="var(--danger)" icon={XCircle} sublabel="Require investigation" />
        <MetricCard label="Total Variance" value={totalVariance} prefix="$" color="var(--accent-amber)" icon={TrendingDown} sublabel="Underpaid amount" />
        <MetricCard label="Audits Run" value={mockResults.length} color="var(--accent-teal)" icon={Search} sublabel="Completed this cycle" />
      </motion.div>

      {/* Accuracy bar */}
      <motion.div variants={fadeUp} style={{ marginBottom: '24px' }}>
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--text-secondary)' }}>
              Reconciliation Accuracy
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--accent-teal)' }}>
              {accuracy}%
            </span>
          </div>
          <div style={{
            height: '6px',
            background: 'var(--bg-raised)',
            borderRadius: '3px',
            overflow: 'hidden'
          }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${accuracy}%` }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
              style={{
                height: '100%',
                background: accuracy > 80 ? 'var(--success)' : accuracy > 60 ? 'var(--accent-amber)' : 'var(--danger)',
                borderRadius: '3px',
                boxShadow: `0 0 8px ${accuracy > 80 ? 'rgba(34,197,94,0.4)' : 'rgba(245,166,35,0.4)'}`
              }}
            />
          </div>
        </Card>
      </motion.div>

      {/* Tabs */}
      <motion.div variants={fadeUp} style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        marginBottom: '16px'
      }}>
        {tabs.map(t => (
          <button
            key={t}
            onClick={() => { setActiveTab(t); setPage(1); }}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              fontWeight: 500,
              textTransform: 'uppercase',
              padding: '6px 12px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid',
              borderColor: activeTab === t ? 'var(--accent-teal)' : 'var(--border-subtle)',
              background: activeTab === t ? 'rgba(0,217,192,0.08)' : 'transparent',
              color: activeTab === t ? 'var(--accent-teal)' : 'var(--text-muted)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              position: 'relative'
            }}
          >
            {t === 'all' ? 'ALL' : t.replace('_', ' ')}
          </button>
        ))}
      </motion.div>

      {/* Table */}
      <motion.div variants={fadeUp} style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '14px 20px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <h2 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '15px',
            fontWeight: 700,
            color: 'var(--text-primary)'
          }}>
            Audit Findings
          </h2>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>
            {filtered.length} results
          </span>
        </div>
        <DataTable
          columns={columns}
          data={paged}
          pagination={{
            page,
            perPage,
            total: filtered.length,
            onPageChange: setPage
          }}
        />
      </motion.div>
    </motion.div>
  );
}
