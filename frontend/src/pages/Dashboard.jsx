import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Activity, DollarSign, AlertTriangle } from 'lucide-react';
import MetricCard from '../components/ui/MetricCard';
import DataTable from '../components/ui/DataTable';
import Badge from '../components/ui/Badge';

const stagger = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.04 }
  }
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } }
};

const mockTableData = [
  { id: '1', contract_id: 'CTR-992-A', studio: 'Neon Films', territory: 'Global', plays: 1250000, royalty_amount: 12500.00, status: 'clean' },
  { id: '2', contract_id: 'CTR-841-B', studio: 'Nova Media', territory: 'US/CA', plays: 850000, royalty_amount: 8500.00, status: 'missing' },
  { id: '3', contract_id: 'CTR-204-C', studio: 'Aurora Corp', territory: 'EU', plays: 320000, royalty_amount: 3200.00, status: 'underpayment' },
  { id: '4', contract_id: 'CTR-110-D', studio: 'Verve Studio', territory: 'Asia', plays: 410000, royalty_amount: 4100.00, status: 'overpayment' },
  { id: '5', contract_id: 'CTR-655-E', studio: 'Apex Digital', territory: 'LATAM', plays: 92000, royalty_amount: 920.00, status: 'clean' },
  { id: '6', contract_id: 'CTR-301-F', studio: 'Black Mesa Records', territory: 'EU/UK', plays: 1780000, royalty_amount: 17800.00, status: 'underpayment' },
];

const columns = [
  { key: 'contract_id', label: 'Contract' },
  { key: 'studio', label: 'Studio' },
  { key: 'territory', label: 'Territory' },
  { key: 'plays', label: 'Total Plays', align: 'right', render: (v) => v.toLocaleString() },
  { key: 'royalty_amount', label: 'Royalty', align: 'right', render: (v) => `$${v.toLocaleString(undefined, { minimumFractionDigits: 2 })}` },
  { key: 'status', label: 'Status', render: (v) => <Badge type={v}>{v}</Badge> }
];

export default function Dashboard() {
  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
    >
      {/* Hero section */}
      <motion.div variants={fadeUp} style={{
        position: 'relative',
        padding: '48px 0 40px',
        marginBottom: '32px'
      }}>
        {/* Radial glow */}
        <div style={{
          position: 'absolute',
          top: '-60px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '800px',
          height: '400px',
          background: 'radial-gradient(ellipse at center, rgba(0,217,192,0.06) 0%, transparent 60%)',
          pointerEvents: 'none',
          zIndex: 0
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 className="page-title">
            Executive Overview
          </h1>
          <p style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '13px',
            color: 'var(--text-muted)',
            letterSpacing: '0.02em'
          }}>
            System online -- Awaiting audit command
          </p>
        </div>
      </motion.div>

      {/* Metric cards */}
      <motion.div variants={fadeUp} style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '16px',
        marginBottom: '32px'
      }}>
        <MetricCard
          label="Total Contracts"
          value={1000}
          color="var(--accent-teal)"
          sublabel="Active agreements loaded"
          icon={FileText}
        />
        <MetricCard
          label="Streaming Events"
          value={100000}
          color="var(--accent-purple)"
          sublabel="Cross-referenced records"
          icon={Activity}
        />
        <MetricCard
          label="Leakage Detected"
          value={52340}
          prefix="$"
          color="var(--danger)"
          sublabel="Recoverable underpayments"
          icon={DollarSign}
        />
        <MetricCard
          label="Violations"
          value={147}
          color="var(--accent-amber)"
          sublabel="Flagged for review"
          icon={AlertTriangle}
        />
      </motion.div>

      {/* Data table */}
      <motion.div variants={fadeUp} style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <h2 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '16px',
            fontWeight: 700,
            color: 'var(--text-primary)'
          }}>
            Recent Audit Flags
          </h2>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            color: 'var(--text-muted)'
          }}>
            {mockTableData.length} records
          </span>
        </div>
        <DataTable
          columns={columns}
          data={mockTableData}
        />
      </motion.div>
    </motion.div>
  );
}
