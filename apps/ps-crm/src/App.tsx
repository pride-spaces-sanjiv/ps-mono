import React, { useState, useEffect } from 'react';
import {
  Users,
  Building2,
  TrendingUp,
  Briefcase,
  Plus,
  ArrowUpRight,
  Server,
  Zap
} from 'lucide-react';
import { MetricCard, StatusBadge } from '@pride-spaces/ui';

export default function App() {
  const [backendStatus, setBackendStatus] = useState<'checking' | 'connected' | 'offline'>('checking');
  const [backendUrl] = useState(import.meta.env.VITE_BASE_API || 'http://localhost:5011');

  useEffect(() => {
    fetch(backendUrl)
      .then((res) => (res.ok ? setBackendStatus('connected') : setBackendStatus('offline')))
      .catch(() => setBackendStatus('offline'));
  }, [backendUrl]);

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0b0f17 0%, #111827 50%, #0f172a 100%)', color: '#f8fafc', padding: '1.5rem 2rem', fontFamily: 'Inter, sans-serif' }}>
      {/* Header Bar */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)' }}>
            <Users style={{ width: '22px', height: '22px', color: '#ffffff' }} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.02em', background: 'linear-gradient(90deg, #ffffff 0%, #cbd5e1 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Pride Spaces CRM
            </h1>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 500 }}>Customer Relationship Management Portal</span>
          </div>
        </div>

        {/* System & Backend Status Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <StatusBadge label="Backend API" status={backendStatus === 'connected' ? 'active' : backendStatus === 'checking' ? 'warning' : 'offline'} port="5011" />

          <a href="http://localhost:3000" target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(99, 102, 241, 0.1)', color: '#818cf8', border: '1px solid rgba(99, 102, 241, 0.3)', padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 500, transition: 'all 0.2s' }}>
            Admin Portal <ArrowUpRight style={{ width: '14px', height: '14px' }} />
          </a>
        </div>
      </header>

      {/* Main Welcome Hero Section */}
      <main style={{ marginTop: '2rem', maxWidth: '1200px', margin: '2rem auto 0 auto' }}>
        <div style={{ background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.8) 100%)', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.1)', padding: '2.5rem', marginBottom: '2rem', backdropFilter: 'blur(10px)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '200px', height: '200px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, rgba(0,0,0,0) 70%)', pointerEvents: 'none' }}></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(99, 102, 241, 0.15)', color: '#a5b4fc', padding: '0.3rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>
                <Zap style={{ width: '12px', height: '12px' }} /> Integrated Workspace Monorepo (@pride-spaces/ui)
              </div>
              <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem', letterSpacing: '-0.02em', color: '#ffffff' }}>
                Welcome to Pride Spaces CRM
              </h2>
              <p style={{ color: '#94a3b8', fontSize: '1rem', maxWidth: '600px', lineHeight: 1.6 }}>
                Manage workspace leads, client interactions, space operator pipelines, and deal conversions all in one unified platform.
              </p>
            </div>

            <button style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', color: '#ffffff', border: 'none', padding: '0.75rem 1.25rem', borderRadius: '10px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)' }}>
              <Plus style={{ width: '18px', height: '18px' }} /> Create New Lead
            </button>
          </div>
        </div>

        {/* Metrics Grid using @pride-spaces/ui MetricCard */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
          <MetricCard icon={<Users style={{ color: '#6366f1' }} />} title="Active Leads" value="1,248" change="+14% this month" positive />
          <MetricCard icon={<Briefcase style={{ color: '#10b981' }} />} title="Open Opportunities" value="84" change="+8% this week" positive />
          <MetricCard icon={<Building2 style={{ color: '#f59e0b' }} />} title="Matched Spaces" value="312" change="Ready for visit" />
          <MetricCard icon={<TrendingUp style={{ color: '#ec4899' }} />} title="Conversion Rate" value="34.2%" change="+2.4% vs last month" positive />
        </div>

        {/* Recent Activity & Quick Search Section */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
          {/* Quick Actions Panel */}
          <div style={{ background: 'rgba(30, 41, 59, 0.5)', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.08)', padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', color: '#f1f5f9' }}>Quick Actions</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <ActionButton label="Log Call Note" />
              <ActionButton label="Schedule Site Tour" />
              <ActionButton label="Send Proposal" />
              <ActionButton label="Assign Sales Rep" />
            </div>
          </div>

          {/* System Integration Card */}
          <div style={{ background: 'rgba(30, 41, 59, 0.5)', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.08)', padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', color: '#f1f5f9' }}>Monorepo Shared Packages Connected</h3>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <ServiceRow name="@pride-spaces/types" description="Shared Interfaces & Models" status="Linked" />
              <ServiceRow name="@pride-spaces/utils" description="Shared Helper Functions" status="Linked" />
              <ServiceRow name="@pride-spaces/ui" description="Shared UI Component Library" status="Linked" />
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}

function ActionButton({ label }: { label: string }) {
  return (
    <button style={{ background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)', color: '#cbd5e1', padding: '0.75rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}>
      {label}
    </button>
  );
}

function ServiceRow({ name, description, status }: { name: string; description: string; status: string }) {
  return (
    <li style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(15, 23, 42, 0.4)', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.04)', fontSize: '0.85rem' }}>
      <div>
        <span style={{ color: '#e2e8f0', fontWeight: 600, display: 'block' }}>{name}</span>
        <span style={{ color: '#64748b', fontSize: '0.75rem' }}>{description}</span>
      </div>
      <span style={{ color: '#34d399', fontSize: '0.75rem', fontWeight: 600, background: 'rgba(52, 211, 153, 0.1)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>{status}</span>
    </li>
  );
}
