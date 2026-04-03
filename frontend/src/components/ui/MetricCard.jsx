import React from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useEffect } from 'react';
import Card from './Card';

function AnimatedNumber({ value, prefix = '', suffix = '', color }) {
  const motionVal = useMotionValue(0);
  const spring = useSpring(motionVal, { damping: 30, stiffness: 100 });
  const rounded = useTransform(spring, (v) => {
    const num = Math.round(v);
    return `${prefix}${num.toLocaleString()}${suffix}`;
  });

  useEffect(() => {
    motionVal.set(value);
  }, [value, motionVal]);

  return (
    <motion.span style={{
      fontFamily: 'var(--font-mono)',
      fontSize: '36px',
      fontWeight: 700,
      lineHeight: 1,
      color: color || 'var(--text-primary)',
      letterSpacing: '-0.02em'
    }}>
      {rounded}
    </motion.span>
  );
}

export default function MetricCard({ label, value, prefix = '', suffix = '', color, sublabel, icon: Icon }) {
  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{
          fontFamily: 'var(--font-body)',
          fontSize: '11px',
          fontWeight: 600,
          color: 'var(--text-tertiary)',
          marginBottom: '16px',
          letterSpacing: '0.05em',
          textTransform: 'uppercase'
        }}>
          {label}
        </div>
        {Icon && (
          <Icon size={16} color={color || 'var(--text-tertiary)'} strokeWidth={2} />
        )}
      </div>

      <AnimatedNumber value={value} prefix={prefix} suffix={suffix} color={color || 'var(--text-primary)'} />

      {sublabel && (
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '10px',
          color: 'var(--text-tertiary)',
          marginTop: '12px',
          letterSpacing: '0.02em',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          <span style={{ opacity: 0.5 }}>::</span> {sublabel.toUpperCase()}
        </div>
      )}
    </Card>
  );
}
