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
        background: 'rgba(18, 18, 30, 0.7)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        border: '1px solid rgba(232, 184, 75, 0.12)',
        borderRadius: 'var(--radius-md)',
        padding: '20px',
        position: 'relative',
        overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
        boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.05)',
        ...style
      }}
    >
      {children}
    </motion.div>
  );
}
