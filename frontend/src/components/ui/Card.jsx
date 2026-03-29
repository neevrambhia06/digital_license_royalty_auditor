import React from 'react';
import { motion } from 'framer-motion';

export default function Card({ children, className = '', onClick, style = {} }) {
  return (
    <motion.div
      onClick={onClick}
      className={className}
      whileHover={onClick ? {
        scale: 1.01,
        borderColor: 'var(--border-glow)',
        transition: { duration: 0.15, ease: 'easeOut' }
      } : {}}
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        padding: '20px',
        position: 'relative',
        overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'border-color 0.15s ease',
        ...style
      }}
    >
      {children}
    </motion.div>
  );
}
