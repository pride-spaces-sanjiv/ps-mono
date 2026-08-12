import React from 'react';

export interface StatusBadgeProps {
  label: string;
  status: 'active' | 'warning' | 'offline';
  port?: string;
}

export function StatusBadge({ label, status, port }: StatusBadgeProps) {
  const colorMap = {
    active: { bg: 'rgba(34, 197, 94, 0.1)', text: '#22c55e' },
    warning: { bg: 'rgba(234, 179, 8, 0.1)', text: '#eab308' },
    offline: { bg: 'rgba(239, 68, 68, 0.1)', text: '#ef4444' },
  };

  const current = colorMap[status];

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(30, 41, 59, 0.6)', padding: '0.4rem 0.8rem', borderRadius: '9999px', border: '1px solid rgba(255, 255, 255, 0.08)', fontSize: '0.8rem' }}>
      <span style={{ color: '#94a3b8' }}>{label}:</span>
      {port && <span style={{ color: '#e2e8f0', fontWeight: 600 }}>:{port}</span>}
      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: current.text, display: 'inline-block' }}></span>
    </div>
  );
}
