import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Shield, MapPin, Clock, Tag } from 'lucide-react';
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
const VIOLATION_TYPES = ['territory', 'expired_contract', 'wrong_tier', 'missing_license'];
const SEVERITIES = ['high', 'medium', 'low'];

function generateViolations() {
  const violations = [];
  for (let i = 0; i < 35; i++) {
    const contractNum = ((i * 11 + 3) % 40) + 1;
    const contentType = ['Movie', 'Show', 'Album', 'Podcast'][i % 4];
    const vType = VIOLATION_TYPES[i % 4];
    const severity = i % 5 === 0 ? 'high' : i % 3 === 0 ? 'medium' : 'low';
    const impactAmount = severity === 'high' ? 2000 + (i * 337 % 8000) : severity === 'medium' ? 500 + (i * 137 % 3000) : 100 + (i * 47 % 800);

    let description;
    switch (vType) {
      case 'territory':
        description = `Streaming detected in unauthorized territory (${['JP', 'BR', 'FR', 'AU'][i % 4]})`;
        break;
      case 'expired_contract':
        description = `Content streamed after contract expiry date (${2023}-${String((i % 12) + 1).padStart(2, '0')}-30)`;
        break;
      case 'wrong_tier':
        description = `Tier rate applied before threshold reached (${(50000 + i * 1000).toLocaleString()} plays)`;
        break;
      case 'missing_license':
        description = `No valid license found for content in region ${['EU', 'APAC', 'LATAM', 'MEA'][i % 4]}`;
        break;
      default:
        description = 'Unknown violation';
    }

    violations.push({
      id: String(i + 1),
      violation_id: `VIO-${String(i + 1).padStart(5, '0')}`,
      contract_id: `CTR-${String(contractNum).padStart(4, '0')}`,
      content_id: `${contentType}_${String(contractNum).padStart(3, '0')}`,
      studio: STUDIOS[i % STUDIOS.length],
      type: vType,
      severity,
      impact_amount: impactAmount,
      description,
      detected_at: new Date(2024, i % 12, 1 + (i % 28), 8 + (i % 14), i % 60).toISOString(),
      resolved: i % 7 === 0
    });
  }
  return violations;
}

const mockViolations = generateViolations();

const SEVERITY_ICONS = {
  high: { color: 'var(--danger)', icon: '!!!' },
  medium: { color: 'var(--warning)', icon: '!!' },
  low: { color: 'var(--text-muted)', icon: '!' }
};

const columns = [
  { key: 'violation_id', label: 'ID' },
  { key: 'contract_id', label: 'Contract' },
  { key: 'studio', label: 'Studio' },
  {
    key: 'type', label: 'Type',
    render: (v) => <Badge type={v}>{v.replace('_', ' ')}</Badge>
  },
  {
    key: 'severity', label: 'Severity',
    render: (v) => {
      const s = SEVERITY_ICONS[v];
      return (
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '12px',
          fontWeight: 700,
          color: s.color,
          letterSpacing: '0.05em'
        }}>
          {s.icon} {v.toUpperCase()}
        </span>
      );
    }
  },
  {
    key: 'impact_amount', label: 'Impact', align: 'right',
    render: (v) => (
      <span style={{ color: v > 3000 ? 'var(--danger)' : 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
        ${v.toLocaleString()}
      </span>
    )
  },
  {
    key: 'resolved', label: 'Status',
    render: (v) => (
      <span style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '11px',
        color: v ? 'var(--success)' : 'var(--accent-amber)',
        textTransform: 'uppercase'
      }}>
        {v ? 'RESOLVED' : 'OPEN'}
      </span>
    )
  }
];

export default function Violations() {
  const [filterType, setFilterType] = useState('all');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [page, setPage] = useState(1);
  const perPage = 10;

  const filtered = mockViolations.filter(v => {
    const matchType = filterType === 'all' || v.type === filterType;
    const matchSev = filterSeverity === 'all' || v.severity === filterSeverity;
    return matchType && matchSev;
  });
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  const highCount = mockViolations.filter(v => v.severity === 'high').length;
  const openCount = mockViolations.filter(v => !v.resolved).length;
  const totalImpact = mockViolations.reduce((s, v) => s + v.impact_amount, 0);

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
          Violations
        </h1>
        <p style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '13px',
          color: 'var(--text-muted)',
          letterSpacing: '0.02em'
        }}>
          Contract breach detection -- {mockViolations.length} violations flagged
        </p>
      </motion.div>

      {/* Metrics */}
      <motion.div variants={fadeUp} style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <MetricCard label="Total Violations" value={mockViolations.length} color="var(--accent-amber)" icon={AlertTriangle} sublabel="Detected by audit agent" />
        <MetricCard label="Critical (High)" value={highCount} color="var(--danger)" icon={Shield} sublabel="Immediate action required" />
        <MetricCard label="Open Cases" value={openCount} color="var(--accent-red)" icon={Clock} sublabel="Pending resolution" />
        <MetricCard label="Financial Impact" value={totalImpact} prefix="$" color="var(--danger)" icon={Tag} sublabel="Estimated exposure" />
      </motion.div>

      {/* Filters */}
      <motion.div variants={fadeUp} style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        marginBottom: '16px',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Type:</span>
          {['all', ...VIOLATION_TYPES].map(t => (
            <button
              key={t}
              onClick={() => { setFilterType(t); setPage(1); }}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                padding: '4px 10px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid',
                borderColor: filterType === t ? 'var(--accent-teal)' : 'var(--border-subtle)',
                background: filterType === t ? 'rgba(0,217,192,0.08)' : 'transparent',
                color: filterType === t ? 'var(--accent-teal)' : 'var(--text-muted)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                textTransform: 'uppercase'
              }}
            >
              {t === 'all' ? 'ALL' : t.replace('_', ' ')}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Sev:</span>
          {['all', ...SEVERITIES].map(s => (
            <button
              key={s}
              onClick={() => { setFilterSeverity(s); setPage(1); }}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                padding: '4px 10px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid',
                borderColor: filterSeverity === s ? 'var(--accent-teal)' : 'var(--border-subtle)',
                background: filterSeverity === s ? 'rgba(0,217,192,0.08)' : 'transparent',
                color: filterSeverity === s ? 'var(--accent-teal)' : 'var(--text-muted)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                textTransform: 'uppercase'
              }}
            >
              {s}
            </button>
          ))}
        </div>
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
            Violation Log
          </h2>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>
            {filtered.length} entries
          </span>
        </div>
        <DataTable
          columns={columns}
          data={paged}
          expandedRowContent={(row) => (
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Description</div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--text-primary)', marginBottom: '12px' }}>{row.description}</div>
              <div style={{ display: 'flex', gap: '24px' }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Content</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--accent-teal)' }}>{row.content_id}</div>
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Detected</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-primary)' }}>{new Date(row.detected_at).toLocaleString()}</div>
                </div>
              </div>
            </div>
          )}
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
