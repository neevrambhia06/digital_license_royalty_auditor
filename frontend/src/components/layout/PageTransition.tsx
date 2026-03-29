import React from 'react';
import { motion } from 'framer-motion';

export default function PageTransition({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={className}
      style={{ height: '100%', width: '100%', position: 'relative' }}
    >
      {children}
    </motion.div>
  );
}
