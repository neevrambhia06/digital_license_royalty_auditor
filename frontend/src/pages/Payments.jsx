import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, DollarSign, AlertTriangle, CheckCircle } from 'lucide-react';
import DataTable from '../components/ui/DataTable';
import Badge from '../components/ui/Badge';
import MetricCard from '../components/ui/MetricCard';

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } }
};
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } }
};

const STUDIOS = ['HelixMedia', 'StellarArts', 'NovaCinema', 'OrbitSound', 'PrismStudios', 'NexusFilms', 'ApexRecords', 'ZenithBroadcast'];
const MONTHS = ['2024-01', '2024-02', '2024-03', '2024-04', '2024-05', '2024-06', '2024-07', '2024-08', '2024-09', '2024-10', '2024-11', '2024-12'];

function generatePayments() {
  const payments = [];
  for (let i = 0; i < 50; i++) {
    const month = MONTHS[i % 12];
    const contractNum = ((i * 7 + 3) % 40) + 1;
    const contentType = ['Movie', 'Show', 'Album', 'Podcast'][i % 4];
    const expected = 200 + (i * 137 % 5000);
    let amountPaid, leakType;

    if (i % 8 === 0) {
      amountPaid = Math.round(expected * 0.82);
      leakType = 'underpayment';
    } else if (i % 13 === 0) {
      amountPaid = Math.round(expected * 1.15);
      leakType = 'overpayment';
    } else if (i % 20 === 0) {
      amountPaid = 0;
      leakType = 'missing';
    } else {
      amountPaid = expected;
      leakType = 'clean';
    }

    const diff = amountPaid - expected;

    payments.push({
      id: String(i + 1),
      payment_id: `PAY-${String(i + 1).padStart(6, '0')}`,
      contract_id: `CTR-${String(contractNum).padStart(4, '0')}`,
      content_id: `${contentType}_${String(contractNum).padStart(3, '0')}`,
      studio: STUDIOS[i % STUDIOS.length],
      payment_month: month,
      expected: expected,
      amount_paid: amountPaid,
      difference: diff,
      status: leakType,
      currency: 'USD'
    });
  }
  return payments;
}

const mockPayments = generatePayments();

const columns = [
  { key: 'payment_id', label: 'Payment ID' },
  { key: 'contract_id', label: 'Contract' },
  { key: 'studio', label: 'Studio' },
  { key: 'payment_month', label: 'Period' },
  {
    key: 'expected', label: 'Expected', align: 'right',
    render: (v) => `$${v.toLocaleString()}`
  },
  {
    key: 'amount_paid', label: 'Paid', align: 'right',
    render: (v) => `$${v.toLocaleString()}`
  },
  {
    key: 'difference', label: 'Delta', align: 'right',
    render: (v) => {
      const color = v < 0 ? 'var(--danger)' : v > 0 ? 'var(--accent-amber)' : 'var(--text-muted)';
      const prefix = v > 0 ? '+' : '';
      return (
        <span style={{ color, fontFamily: 'var(--font-mono)' }}>
          {v === 0 ? '--' : `${prefix}$${v.toLocaleString()}`}
        </span>
      );
    }
  },
  {
    key: 'status', label: 'Status',
    render: (v) => <Badge type={v}>{v}</Badge>
  }
];

export default function Payments() {
  const [filterStatus, setFilterStatus] = useState('all');
  const [page, setPage] = useState(1);
  const perPage = 12;

  const filtered = filterStatus === 'all' ? mockPayments : mockPayments.filter(p => p.status === filterStatus);
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  const totalPaid = mockPayments.reduce((s, p) => s + p.amount_paid, 0);
  const totalExpected = mockPayments.reduce((s, p) => s + p.expected, 0);
  const totalLeakage = mockPayments.reduce((s, p) => s + Math.max(0, p.expected - p.amount_paid), 0);
  const cleanCount = mockPayments.filter(p => p.status === 'clean').length;

  return (
    <motion.div variants={stagger} initial="hidden" animate="show">
      {/* Header */}
      <motion.div variants={fadeUp} style={{ marginBottom: '32px' }}>
        <h1 className="page-title">
          Payment Ledger
        </h1>
        <p style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '13px',
          color: 'var(--text-muted)',
          letterSpacing: '0.02em'
        }}>
          Reconciliation engine -- {mockPayments.length} payment records
        </p>
      </motion.div>

      {/* Metrics */}
      <motion.div variants={fadeUp} style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <MetricCard label="Total Expected" value={totalExpected} prefix="$" color="var(--accent-teal)" icon={DollarSign} sublabel="Owed per contracts" />
        <MetricCard label="Total Paid" value={totalPaid} prefix="$" color="var(--accent-purple)" icon={CreditCard} sublabel="Received payments" />
        <MetricCard label="Leakage" value={totalLeakage} prefix="$" color="var(--danger)" icon={AlertTriangle} sublabel="Underpaid amount" />
        <MetricCard label="Clean Payments" value={cleanCount} color="var(--success)" icon={CheckCircle} sublabel={`${Math.round(cleanCount / mockPayments.length * 100)}% reconciled`} />
      </motion.div>

      {/* Filters */}
      <motion.div variants={fadeUp} style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        marginBottom: '16px'
      }}>
        {['all', 'clean', 'underpayment', 'overpayment', 'missing'].map(f => (
          <button
            key={f}
            onClick={() => { setFilterStatus(f); setPage(1); }}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              fontWeight: 500,
              textTransform: 'uppercase',
              padding: '6px 12px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid',
              borderColor: filterStatus === f ? 'var(--accent-teal)' : 'var(--border-subtle)',
              background: filterStatus === f ? 'rgba(0,217,192,0.08)' : 'transparent',
              color: filterStatus === f ? 'var(--accent-teal)' : 'var(--text-muted)',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            {f === 'all' ? 'ALL' : f.replace('_', ' ')}
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
            Payment Records
          </h2>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            color: 'var(--text-muted)'
          }}>
            {filtered.length} records
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
