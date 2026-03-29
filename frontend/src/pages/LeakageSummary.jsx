import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingDown, DollarSign, Building2, Globe, BarChart3 } from 'lucide-react';
import MetricCard from '../components/ui/MetricCard';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } }
};
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } }
};

const LEAK_BY_STUDIO = [
  { studio: 'HelixMedia', amount: 12450, contracts: 8, severity: 'high' },
  { studio: 'NovaCinema', amount: 8920, contracts: 5, severity: 'high' },
  { studio: 'ApexRecords', amount: 6340, contracts: 4, severity: 'medium' },
  { studio: 'StellarArts', amount: 4180, contracts: 3, severity: 'medium' },
  { studio: 'OrbitSound', amount: 3210, contracts: 6, severity: 'medium' },
  { studio: 'PrismStudios', amount: 2850, contracts: 2, severity: 'low' },
  { studio: 'NexusFilms', amount: 1920, contracts: 3, severity: 'low' },
  { studio: 'ZenithBroadcast', amount: 1470, contracts: 2, severity: 'low' },
];

const LEAK_BY_TYPE = [
  { type: 'Underpayment', amount: 22340, count: 34, color: 'var(--danger)' },
  { type: 'Missing Payment', amount: 9800, count: 8, color: 'var(--accent-purple)' },
  { type: 'Wrong Tier Rate', amount: 5640, count: 12, color: 'var(--accent-amber)' },
  { type: 'Overpayment Credit', amount: 3560, count: 6, color: 'var(--accent-teal)' },
];

const LEAK_BY_TERRITORY = [
  { territory: 'US', amount: 14200, percentage: 34 },
  { territory: 'EU', amount: 9800, percentage: 24 },
  { territory: 'UK', amount: 6400, percentage: 15 },
  { territory: 'APAC', amount: 5200, percentage: 13 },
  { territory: 'LATAM', amount: 3400, percentage: 8 },
  { territory: 'Other', amount: 2340, percentage: 6 },
];

const MONTHLY_TREND = [
  { month: 'Jan', amount: 2100 },
  { month: 'Feb', amount: 3400 },
  { month: 'Mar', amount: 2800 },
  { month: 'Apr', amount: 4200 },
  { month: 'May', amount: 3600 },
  { month: 'Jun', amount: 5100 },
  { month: 'Jul', amount: 4800 },
  { month: 'Aug', amount: 3900 },
  { month: 'Sep', amount: 4400 },
  { month: 'Oct', amount: 3200 },
  { month: 'Nov', amount: 2900 },
  { month: 'Dec', amount: 2910 },
];

const totalLeakage = LEAK_BY_STUDIO.reduce((s, l) => s + l.amount, 0);
const maxStudioLeak = Math.max(...LEAK_BY_STUDIO.map(l => l.amount));
const maxTypeLeak = Math.max(...LEAK_BY_TYPE.map(l => l.amount));
const maxMonthly = Math.max(...MONTHLY_TREND.map(m => m.amount));

function BarRow({ label, value, max, color, sublabel }) {
  return (
    <div style={{ marginBottom: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--text-primary)' }}>{label}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {sublabel && <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>{sublabel}</span>}
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: color || 'var(--text-primary)', fontWeight: 600 }}>
            ${value.toLocaleString()}
          </span>
        </div>
      </div>
      <div style={{ height: '4px', background: 'var(--bg-raised)', borderRadius: '2px', overflow: 'hidden' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${(value / max) * 100}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{
            height: '100%',
            background: color || 'var(--accent-teal)',
            borderRadius: '2px'
          }}
        />
      </div>
    </div>
  );
}

export default function LeakageSummary() {
  return (
    <motion.div variants={stagger} initial="hidden" animate="show">
      {/* Header */}
      <motion.div variants={fadeUp} style={{
        position: 'relative',
        padding: '48px 0 40px',
        marginBottom: '32px'
      }}>
        <div style={{
          position: 'absolute',
          top: '-40px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '600px',
          height: '300px',
          background: 'radial-gradient(ellipse at center, rgba(239,68,68,0.05) 0%, transparent 60%)',
          pointerEvents: 'none',
          zIndex: 0
        }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '28px',
            fontWeight: 800,
            color: 'var(--text-primary)',
            marginBottom: '6px'
          }}>
            Leakage Summary
          </h1>
          <p style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '13px',
            color: 'var(--text-muted)',
            letterSpacing: '0.02em'
          }}>
            Revenue loss analysis -- FY2024 audit cycle
          </p>
        </div>
      </motion.div>

      {/* Big number */}
      <motion.div variants={fadeUp} style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
        marginBottom: '32px'
      }}>
        <MetricCard label="Total Leakage" value={totalLeakage} prefix="$" color="var(--danger)" icon={TrendingDown} sublabel="Recoverable revenue" />
        <MetricCard label="Affected Contracts" value={LEAK_BY_STUDIO.reduce((s, l) => s + l.contracts, 0)} color="var(--accent-amber)" icon={DollarSign} sublabel="Across all studios" />
        <MetricCard label="Studios Impacted" value={LEAK_BY_STUDIO.length} color="var(--accent-purple)" icon={Building2} sublabel="With active leakage" />
        <MetricCard label="Recovery Rate" value={72} suffix="%" color="var(--success)" icon={BarChart3} sublabel="Claims in progress" />
      </motion.div>

      {/* Charts grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '16px',
        marginBottom: '24px'
      }}>
        {/* By Studio */}
        <motion.div variants={fadeUp}>
          <Card>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: '20px'
            }}>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Leakage by Studio
              </h3>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>
                {LEAK_BY_STUDIO.length} studios
              </span>
            </div>
            {LEAK_BY_STUDIO.map((item) => (
              <BarRow
                key={item.studio}
                label={item.studio}
                value={item.amount}
                max={maxStudioLeak}
                color={item.severity === 'high' ? 'var(--danger)' : item.severity === 'medium' ? 'var(--accent-amber)' : 'var(--text-muted)'}
                sublabel={`${item.contracts} contracts`}
              />
            ))}
          </Card>
        </motion.div>

        {/* By Type */}
        <motion.div variants={fadeUp}>
          <Card>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: '20px'
            }}>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Leakage by Type
              </h3>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>
                {LEAK_BY_TYPE.reduce((s, l) => s + l.count, 0)} incidents
              </span>
            </div>
            {LEAK_BY_TYPE.map((item) => (
              <BarRow
                key={item.type}
                label={item.type}
                value={item.amount}
                max={maxTypeLeak}
                color={item.color}
                sublabel={`${item.count} cases`}
              />
            ))}
          </Card>
        </motion.div>
      </div>

      {/* Territory breakdown */}
      <motion.div variants={fadeUp} style={{ marginBottom: '24px' }}>
        <Card>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: '20px'
          }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Leakage by Territory
            </h3>
            <Globe size={16} color="var(--text-muted)" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px' }}>
            {LEAK_BY_TERRITORY.map((item) => (
              <div key={item.territory} style={{
                background: 'var(--bg-raised)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '16px'
              }}>
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12px',
                  color: 'var(--text-muted)',
                  marginBottom: '8px',
                  letterSpacing: '0.1em'
                }}>
                  {item.territory}
                </div>
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '20px',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  marginBottom: '4px'
                }}>
                  ${item.amount.toLocaleString()}
                </div>
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  color: 'var(--accent-teal)'
                }}>
                  {item.percentage}% of total
                </div>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Monthly Trend */}
      <motion.div variants={fadeUp}>
        <Card>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: '20px'
          }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Monthly Leakage Trend
            </h3>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>FY2024</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '140px' }}>
            {MONTHLY_TREND.map((item, idx) => {
              const height = (item.amount / maxMonthly) * 120;
              return (
                <div key={item.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '10px',
                    color: 'var(--text-muted)'
                  }}>
                    ${(item.amount / 1000).toFixed(1)}k
                  </span>
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height }}
                    transition={{ duration: 0.6, delay: idx * 0.04, ease: 'easeOut' }}
                    style={{
                      width: '100%',
                      maxWidth: '40px',
                      background: item.amount > 4000
                        ? 'var(--danger)'
                        : item.amount > 3000
                          ? 'var(--accent-amber)'
                          : 'var(--accent-teal)',
                      borderRadius: '2px 2px 0 0',
                      opacity: 0.8
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.opacity = '1'; }}
                    onMouseOut={(e) => { e.currentTarget.style.opacity = '0.8'; }}
                  />
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '10px',
                    color: 'var(--text-muted)'
                  }}>
                    {item.month}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}
