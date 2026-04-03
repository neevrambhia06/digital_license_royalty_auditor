import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

export default function DataTable({
  columns,
  data,
  onRowClick,
  isLoading,
  expandedRowId,
  expandedRowContent,
  pagination
}) {
  const [sortConfig, setSortConfig] = useState(null);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig?.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const isNumeric = (key) => {
    const numericKeywords = ['amount', 'paid', 'plays', 'rate', 'expected', 'actual', 'difference', 'royalty', 'count', 'total'];
    return numericKeywords.some(kw => key.toLowerCase().includes(kw));
  };

  const isId = (key) => {
    return key.toLowerCase().includes('id') || key.toLowerCase().includes('contract');
  };

  const sortedData = React.useMemo(() => {
    let sortable = [...(data || [])];
    if (sortConfig) {
      sortable.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortable;
  }, [data, sortConfig]);

  // Shimmer skeleton
  if (isLoading) {
    return (
      <div style={{ width: '100%', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              {columns.map(col => (
                <th key={col.key} style={{
                  padding: '12px 16px',
                  textAlign: 'left'
                }}>
                  <div style={{ height: '12px', width: '72px', background: 'var(--bg-elevated)', borderRadius: '2px' }} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...Array(6)].map((_, i) => (
              <tr key={i} style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                {columns.map(col => (
                  <td key={col.key} style={{ padding: '14px 16px' }}>
                    <div className="dt-shimmer" style={{
                      height: '16px',
                      width: `${50 + Math.random() * 40}%`,
                      borderRadius: '2px',
                      background: 'linear-gradient(90deg, rgba(0,0,0,0.04) 25%, rgba(0,0,0,0.08) 50%, rgba(0,0,0,0.04) 75%)',
                      backgroundSize: '200% 100%'
                    }} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <style>{`
          @keyframes dtShimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
          .dt-shimmer { animation: dtShimmer 1.5s infinite ease-in-out; }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ width: '100%' }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-surface)' }}>
              {columns.map((col) => {
                const numeric = isNumeric(col.key);
                return (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: '11px',
                      fontWeight: 600,
                      color: 'var(--text-tertiary)',
                      padding: '12px 16px',
                      cursor: 'pointer',
                      textAlign: col.align || (numeric ? 'right' : 'left'),
                      width: col.width || 'auto',
                      userSelect: 'none',
                      whiteSpace: 'nowrap',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: col.align === 'right' || numeric ? 'flex-end' : 'flex-start',
                      gap: '4px'
                    }}>
                      {col.label}
                      {sortConfig?.key === col.key && (
                        <span style={{ color: 'var(--gold-mid)' }}>
                          {sortConfig.direction === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {sortedData.map((row, idx) => {
              const isExpanded = expandedRowId === row.id;
              return (
                <React.Fragment key={row.id || idx}>
                  <motion.tr
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.02, duration: 0.25 }}
                    style={{
                      borderBottom: '1px solid rgba(0,0,0,0.05)',
                      cursor: onRowClick ? 'pointer' : 'default',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--gold-ghost)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                    onClick={() => onRowClick?.(row)}
                  >
                    {columns.map((col) => {
                      const numeric = isNumeric(col.key);
                      const id = isId(col.key);
                      return (
                        <td key={col.key} style={{
                          padding: '12px 16px',
                          fontFamily: (numeric || id) ? 'var(--font-mono)' : 'var(--font-body)',
                          fontSize: '13px',
                          textAlign: col.align || (numeric ? 'right' : 'left'),
                          color: id ? 'var(--gold-mid)' : 'var(--text-primary)',
                          letterSpacing: (numeric || id) ? '0.01em' : 'normal',
                          fontWeight: id ? 600 : 400
                        }}>
                          {col.render ? col.render(row[col.key], row) : row[col.key]}
                        </td>
                      );
                    })}
                  </motion.tr>

                  {isExpanded && expandedRowContent && (
                    <tr>
                      <td colSpan={columns.length} style={{ padding: 0 }}>
                        <AnimatePresence>
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            style={{ overflow: 'hidden' }}
                          >
                            <div style={{
                              padding: '20px 16px',
                              background: 'var(--bg-elevated)',
                              borderLeft: '3px solid var(--gold-mid)'
                            }}>
                              {expandedRowContent(row)}
                            </div>
                          </motion.div>
                        </AnimatePresence>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}

            {sortedData.length === 0 && (
              <tr>
                <td colSpan={columns.length} style={{
                  padding: '60px',
                  textAlign: 'center',
                  color: 'var(--text-tertiary)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12px',
                  letterSpacing: '0.05em'
                }}>
                  :: NO_RECORDS_FOUND_IN_ACTIVE_DATASET ::
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pagination && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          borderTop: '1px solid var(--border-surface)',
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          color: 'var(--text-tertiary)',
          background: 'var(--bg-base)'
        }}>
          <div>
            SHOWING {((pagination.page - 1) * pagination.perPage) + 1}–{Math.min(pagination.page * pagination.perPage, pagination.total)} OF {pagination.total} AUDIT_RECORDS
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <PaginationButton
              disabled={pagination.page <= 1}
              onClick={() => pagination.onPageChange(pagination.page - 1)}
            >
              <ChevronLeft size={14} />
            </PaginationButton>
            <PaginationButton
              disabled={pagination.page * pagination.perPage >= pagination.total}
              onClick={() => pagination.onPageChange(pagination.page + 1)}
            >
              <ChevronRight size={14} />
            </PaginationButton>
          </div>
        </div>
      )}
    </div>
  );
}

function PaginationButton({ children, disabled, onClick }) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '32px',
        height: '32px',
        background: '#FFFFFF',
        border: '1px solid rgba(0,0,0,0.08)',
        borderRadius: 'var(--radius-sm)',
        color: disabled ? 'var(--text-tertiary)' : 'var(--text-secondary)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        opacity: disabled ? 0.3 : 1
      }}
      onMouseOver={(e) => {
        if (!disabled) {
          e.currentTarget.style.borderColor = 'var(--gold-mid)';
          e.currentTarget.style.background = 'var(--gold-ghost)';
          e.currentTarget.style.color = 'var(--gold-mid)';
        }
      }}
      onMouseOut={(e) => {
        if (!disabled) {
          e.currentTarget.style.borderColor = 'rgba(0,0,0,0.08)';
          e.currentTarget.style.background = '#FFFFFF';
          e.currentTarget.style.color = 'var(--text-secondary)';
        }
      }}
    >
      {children}
    </button>
  );
}
