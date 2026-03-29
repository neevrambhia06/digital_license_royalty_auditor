import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Search, Filter, Calendar, Globe, Download } from 'lucide-react';
import DataTable from '../components/ui/DataTable';
import Badge from '../components/ui/Badge';
import MetricCard from '../components/ui/MetricCard';
import { exportToCSV } from '../utils/exportUtils';
import toast from 'react-hot-toast';

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } }
};
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } }
};

const STUDIOS = [
  'HelixMedia', 'StellarArts', 'NovaCinema', 'OrbitSound', 'PrismStudios',
  'NexusFilms', 'ApexRecords', 'ZenithBroadcast', 'AuroraMedia', 'VortexTV',
  'ParallaxPics', 'MeridianMusic', 'SolsticeStudios', 'EclipticArts', 'HorizonRecords'
];

const TERRITORIES = ['US', 'CA', 'UK', 'IN', 'DE', 'JP', 'BR', 'AU', 'FR'];
const CONTENT_TYPES = ['Movie', 'Show', 'Album', 'Podcast'];

function generateContracts() {
  const contracts = [];
  for (let i = 1; i <= 40; i++) {
    const isExpired = i % 12 === 0;
    const studio = STUDIOS[i % STUDIOS.length];
    const contentType = CONTENT_TYPES[i % 4];
    const territory = TERRITORIES.slice(0, 2 + (i % 5));
    const royaltyRate = (0.05 + (i * 7 % 15) / 100).toFixed(4);
    const ratePerPlay = (0.01 + (i * 3 % 7) / 100).toFixed(4);
    const tierThreshold = [50000, 100000, 200000, 500000][i % 4];
    const minGuarantee = i % 3 === 0 ? (500 + i * 47) : 0;

    contracts.push({
      id: String(i),
      contract_id: `CTR-${String(i).padStart(4, '0')}`,
      content_id: `${contentType}_${String(i).padStart(3, '0')}`,
      studio,
      territory: territory.join(', '),
      royalty_rate: Number(royaltyRate),
      rate_per_play: Number(ratePerPlay),
      tier_threshold: tierThreshold,
      minimum_guarantee: minGuarantee,
      start_date: isExpired ? '2022-03-15' : '2023-06-01',
      end_date: isExpired ? '2023-11-30' : '2026-12-31',
      status: isExpired ? 'expired' : 'active',
    });
  }
  return contracts;
}

const mockContracts = generateContracts();

const columns = [
  { key: 'contract_id', label: 'Contract ID' },
  { key: 'content_id', label: 'Content' },
  { key: 'studio', label: 'Studio' },
  { key: 'territory', label: 'Territory' },
  {
    key: 'royalty_rate', label: 'Rate', align: 'right',
    render: (v) => `${(v * 100).toFixed(1)}%`
  },
  {
    key: 'rate_per_play', label: '$/Play', align: 'right',
    render: (v) => `$${v.toFixed(4)}`
  },
  {
    key: 'tier_threshold', label: 'Tier Cap', align: 'right',
    render: (v) => v.toLocaleString()
  },
  {
    key: 'minimum_guarantee', label: 'Min. Guarantee', align: 'right',
    render: (v) => v > 0 ? `$${v.toLocaleString()}` : '--'
  },
  {
    key: 'status', label: 'Status',
    render: (v) => <Badge type={v}>{v}</Badge>
  }
];

export default function Contracts() {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [page, setPage] = useState(1);
  const perPage = 12;

  const filtered = mockContracts.filter(c => {
    const matchSearch = !search ||
      c.contract_id.toLowerCase().includes(search.toLowerCase()) ||
      c.studio.toLowerCase().includes(search.toLowerCase()) ||
      c.content_id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || c.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const paged = filtered.slice((page - 1) * perPage, page * perPage);
  const activeCount = mockContracts.filter(c => c.status === 'active').length;
  const expiredCount = mockContracts.filter(c => c.status === 'expired').length;
  const totalGuarantee = mockContracts.reduce((s, c) => s + c.minimum_guarantee, 0);

  const handleExport = () => {
    exportToCSV(filtered, 'contracts_export');
    toast.success('Contracts exported to CSV');
  };

  useEffect(() => {
    const onGlobalExport = () => handleExport();
    window.addEventListener('export:csv', onGlobalExport);
    return () => window.removeEventListener('export:csv', onGlobalExport);
  }, [filtered]);

  return (
    <motion.div variants={stagger} initial="hidden" animate="show">
      {/* Header */}
      <motion.div variants={fadeUp} style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '28px',
            fontWeight: 800,
            color: 'var(--text-primary)',
            marginBottom: '6px'
          }}>
            License Contracts
          </h1>
          <p style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '13px',
            color: 'var(--text-muted)',
            letterSpacing: '0.02em'
          }}>
            {mockContracts.length} agreements loaded -- {activeCount} active, {expiredCount} expired
          </p>
        </div>
        <button
          onClick={handleExport}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            background: 'var(--accent-teal)',
            color: 'var(--bg-void)',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
            fontWeight: 700,
            boxShadow: '0 0 15px rgba(0,217,192,0.3)',
            transition: 'all 0.2s'
          }}
          onMouseOver={e => e.currentTarget.style.transform = 'translateY(-1px)'}
          onMouseOut={e => e.currentTarget.style.transform = 'none'}
        >
          <Download size={14} /> EXPORT CSV
        </button>
      </motion.div>

      {/* Metric row */}
      <motion.div variants={fadeUp} style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <MetricCard label="Total Contracts" value={mockContracts.length} color="var(--accent-teal)" icon={FileText} sublabel="Loaded from database" />
        <MetricCard label="Active" value={activeCount} color="var(--success)" icon={Calendar} sublabel="Currently enforceable" />
        <MetricCard label="Expired" value={expiredCount} color="var(--danger)" icon={Calendar} sublabel="Past end date" />
        <MetricCard label="Min. Guarantees" value={totalGuarantee} prefix="$" color="var(--accent-amber)" icon={Globe} sublabel="Across all contracts" />
      </motion.div>

      {/* Filters */}
      <motion.div variants={fadeUp} style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '16px',
        flexWrap: 'wrap'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-sm)',
          padding: '6px 12px',
          flex: '1 1 auto',
          minWidth: '240px',
          maxWidth: '360px'
        }}>
          <Search size={14} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Search contract ID, studio, content..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-body)',
              fontSize: '13px',
              width: '100%'
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          {['all', 'active', 'expired'].map(f => (
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
                transition: 'all 0.15s ease'
              }}
            >
              {f}
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
            Contract Registry
          </h2>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            color: 'var(--text-muted)'
          }}>
            {filtered.length} matching
          </span>
        </div>
        <div style={{ overflowX: 'auto', width: '100%' }}>
        <DataTable
          columns={columns}
          data={paged}
          pagination={{
            page,
            perPage,
            total: filtered.length,
            onPageChange: setPage
          }}
          expandedRowContent={(row) => (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>Term</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--text-primary)' }}>
                  {row.start_date} -- {row.end_date}
                </div>
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>Tier Rate</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--text-primary)' }}>
                  ${(row.rate_per_play * 0.85).toFixed(4)}/play after {row.tier_threshold.toLocaleString()} plays
                </div>
              </div>
            </div>
          )}
        />
        </div>
      </motion.div>
    </motion.div>
  );
}
