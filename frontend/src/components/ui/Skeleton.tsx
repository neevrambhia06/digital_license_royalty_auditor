import React from 'react';

export default function Skeleton({ width = '100%', height = '20px', borderRadius = '4px', className = '', style = {} }: any) {
  return (
    <div
      className={`skeleton-shimmer ${className}`}
      style={{
        width,
        height,
        borderRadius,
        background: 'var(--bg-raised)',
        border: '1px solid var(--border-subtle)',
        position: 'relative',
        overflow: 'hidden',
        ...style
      }}
    />
  );
}
