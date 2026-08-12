import React from 'react';

export interface MetricCardProps {
  icon?: React.ReactNode;
  title: string;
  value: string | number;
  change?: string;
  positive?: boolean;
}

export function MetricCard({ icon, title, value, change, positive }: MetricCardProps) {
  return (
    <div style={{ background: 'rgba(30, 41, 59, 0.5)', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.08)', padding: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 500 }}>{title}</span>
        {icon && <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '0.5rem', borderRadius: '8px' }}>{icon}</div>}
      </div>
      <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.25rem' }}>{value}</div>
      {change && (
        <div style={{ fontSize: '0.75rem', color: positive ? '#34d399' : '#94a3b8', fontWeight: 500 }}>
          {change}
        </div>
      )}
    </div>
  );
}
