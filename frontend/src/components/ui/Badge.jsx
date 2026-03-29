import React from 'react';

const STYLE_MAP = {
  // Status
  active:    { bg: 'rgba(0,217,192,0.08)', color: 'var(--accent-teal)',   border: 'rgba(0,217,192,0.25)' },
  clean:     { bg: 'rgba(34,197,94,0.08)',  color: 'var(--success)',       border: 'rgba(34,197,94,0.25)' },
  expired:   { bg: 'rgba(255,77,77,0.08)',  color: 'var(--accent-red)',    border: 'rgba(255,77,77,0.25)' },

  // Payment
  underpayment: { bg: 'rgba(239,68,68,0.08)',  color: 'var(--danger)',     border: 'rgba(239,68,68,0.25)' },
  overpayment:  { bg: 'rgba(245,166,35,0.08)', color: 'var(--accent-amber)', border: 'rgba(245,166,35,0.25)' },
  missing:      { bg: 'rgba(124,111,237,0.08)', color: 'var(--accent-purple)', border: 'rgba(124,111,237,0.25)' },

  // Severity
  high:   { bg: 'rgba(239,68,68,0.08)',  color: 'var(--danger)',        border: 'rgba(239,68,68,0.25)' },
  medium: { bg: 'rgba(245,158,11,0.08)', color: 'var(--warning)',       border: 'rgba(245,158,11,0.25)' },
  low:    { bg: 'rgba(75,160,128,0.06)', color: 'var(--text-muted)',    border: 'var(--border-subtle)' },

  // Violation types
  territory:        { bg: 'rgba(255,77,77,0.08)',  color: 'var(--accent-red)',    border: 'rgba(255,77,77,0.25)' },
  expired_contract: { bg: 'rgba(245,166,35,0.08)', color: 'var(--accent-amber)',  border: 'rgba(245,166,35,0.25)' },
  wrong_tier:       { bg: 'rgba(124,111,237,0.08)', color: 'var(--accent-purple)', border: 'rgba(124,111,237,0.25)' },
  missing_license:  { bg: 'rgba(239,68,68,0.08)',  color: 'var(--danger)',         border: 'rgba(239,68,68,0.25)' }
};

const DEFAULT = { bg: 'rgba(75,101,128,0.06)', color: 'var(--text-muted)', border: 'var(--border-subtle)' };

export default function Badge({ type, children }) {
  const key = type?.toLowerCase() || '';
  const s = STYLE_MAP[key] || DEFAULT;

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '2px 8px',
      borderRadius: 'var(--radius-sm)',
      fontFamily: 'var(--font-mono)',
      fontSize: '11px',
      fontWeight: 500,
      letterSpacing: '0.02em',
      textTransform: 'uppercase',
      whiteSpace: 'nowrap',
      background: s.bg,
      color: s.color,
      border: `1px solid ${s.border}`,
      lineHeight: '1.6'
    }}>
      {children}
    </span>
  );
}
