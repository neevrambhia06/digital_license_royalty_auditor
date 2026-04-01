import React, { useState } from 'react';
import { Download, FileJson, FileText, FileBarChart } from 'lucide-react';
import { exportToCSV, exportToJSON, exportToPDF } from '../../utils/exportUtils';
import { motion, AnimatePresence } from 'framer-motion';

interface ExportButtonsProps {
  data: any[];
  filename: string;
  title?: string;
}

export default function ExportButtons({ data, filename, title }: ExportButtonsProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleExport = (type: 'csv' | 'json' | 'pdf') => {
    switch (type) {
      case 'csv':
        exportToCSV(data, filename);
        break;
      case 'json':
        exportToJSON(data, filename);
        break;
      case 'pdf':
        exportToPDF(data, filename, title);
        break;
    }
    setIsOpen(false);
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'var(--bg-card)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border-subtle)',
          padding: '8px 16px',
          borderRadius: '6px',
          fontFamily: 'var(--font-body)',
          fontSize: '14px',
          fontWeight: 500,
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
        onMouseOver={e => {
          e.currentTarget.style.borderColor = 'var(--accent-teal)';
          e.currentTarget.style.color = 'var(--accent-teal)';
        }}
        onMouseOut={e => {
          e.currentTarget.style.borderColor = 'var(--border-subtle)';
          e.currentTarget.style.color = 'var(--text-primary)';
        }}
      >
        <Download size={16} /> Export
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              background: 'var(--bg-raised)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '8px',
              minWidth: '160px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
              zIndex: 50,
            }}
          >
            <button
              onClick={() => handleExport('csv')}
              style={dropdownButtonStyle}
            >
              <FileBarChart size={16} /> Export to CSV
            </button>
            <button
              onClick={() => handleExport('json')}
              style={dropdownButtonStyle}
            >
              <FileJson size={16} /> Export to JSON
            </button>
            <button
              onClick={() => handleExport('pdf')}
              style={dropdownButtonStyle}
            >
              <FileText size={16} /> Export to PDF
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const dropdownButtonStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  background: 'transparent',
  border: 'none',
  width: '100%',
  textAlign: 'left',
  padding: '8px 12px',
  color: 'var(--text-secondary)',
  fontFamily: 'var(--font-body)',
  fontSize: '13px',
  cursor: 'pointer',
  borderRadius: '4px',
  transition: 'all 0.2s',
};
