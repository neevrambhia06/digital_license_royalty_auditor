import React from 'react';
import { motion } from 'framer-motion';

export default function Card({ children, className = '', onClick, style = {} }) {
  return (
    <motion.div
      onClick={onClick}
      className={className}
      whileHover={onClick ? {
        scale: 1.005,
        borderColor: 'var(--gold-dim)',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.04)',
      } : {}}
      style={{
        background: '#FFFFFF',
        border: '1px solid rgba(0, 0, 0, 0.06)',
        borderRadius: 'var(--radius-md)',
        padding: '24px',
        position: 'relative',
        overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)',
        ...style
      }}
    >
      {children}
    </motion.div>
  );
}
