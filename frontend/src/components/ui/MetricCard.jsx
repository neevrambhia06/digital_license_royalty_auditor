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
          fontSize: '13px',
          fontWeight: 500,
          color: 'var(--text-secondary)',
          marginBottom: '16px'
        }}>
          {label}
        </div>
        {Icon && (
          <Icon size={18} color={color || 'var(--text-muted)'} strokeWidth={1.5} />
        )}
      </div>

      <AnimatedNumber value={value} prefix={prefix} suffix={suffix} color={color} />

      {sublabel && (
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          color: 'var(--text-muted)',
          marginTop: '12px',
          letterSpacing: '0.01em'
        }}>
          {sublabel}
        </div>
      )}
    </Card>
  );
}
