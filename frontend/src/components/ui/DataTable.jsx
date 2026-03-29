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
                  <div style={{ height: '12px', width: '72px', background: 'var(--bg-raised)', borderRadius: '2px' }} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...Array(6)].map((_, i) => (
              <tr key={i} style={{ borderBottom: '1px solid rgba(31,45,61,0.4)' }}>
                {columns.map(col => (
                  <td key={col.key} style={{ padding: '14px 16px' }}>
                    <div className="dt-shimmer" style={{
                      height: '16px',
                      width: `${50 + Math.random() * 40}%`,
                      borderRadius: '2px',
                      background: 'linear-gradient(90deg, var(--bg-raised) 25%, var(--bg-card) 50%, var(--bg-raised) 75%)',
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
            <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              {columns.map((col) => {
                const numeric = isNumeric(col.key);
                return (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: '12px',
                      fontWeight: 500,
                      color: 'var(--text-muted)',
                      padding: '10px 16px',
                      cursor: 'pointer',
                      textAlign: col.align || (numeric ? 'right' : 'left'),
                      width: col.width || 'auto',
                      userSelect: 'none',
                      whiteSpace: 'nowrap',
                      letterSpacing: '0.02em',
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
                        <span style={{ color: 'var(--accent-teal)' }}>
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
                      borderBottom: '1px solid rgba(31,45,61,0.4)',
                      cursor: onRowClick ? 'pointer' : 'default',
                      transition: 'background-color 0.1s ease'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--bg-card-hover)';
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
                          color: id ? 'var(--accent-teal)' : 'var(--text-primary)',
                          letterSpacing: (numeric || id) ? '0.01em' : 'normal'
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
                              background: 'var(--bg-raised)',
                              borderLeft: '2px solid var(--accent-teal)'
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
                  padding: '40px',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '13px'
                }}>
                  No records found.
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
          borderTop: '1px solid var(--border-subtle)',
          fontFamily: 'var(--font-mono)',
          fontSize: '12px',
          color: 'var(--text-muted)'
        }}>
          <div>
            {((pagination.page - 1) * pagination.perPage) + 1}--{Math.min(pagination.page * pagination.perPage, pagination.total)} of {pagination.total}
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
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
        width: '28px',
        height: '28px',
        background: 'transparent',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-sm)',
        color: disabled ? 'var(--text-muted)' : 'var(--text-secondary)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.1s ease',
        opacity: disabled ? 0.4 : 1
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
