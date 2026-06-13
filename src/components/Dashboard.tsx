'use client';

import { useState } from 'react';
import AgentTimeline from './AgentTimeline';
import ApprovalModal from './ApprovalModal';
import { BarChart, LineChart, Donut } from './charts';

interface DashboardProps {
  incidentId: string | null;
  onTrigger: () => void;
}

const NAV = [
  { icon: '📊', label: 'Incidents', active: true },
  { icon: '🤖', label: 'Agents' },
  { icon: '📕', label: 'Runbooks' },
  { icon: '🔔', label: 'Escalations' },
  { icon: '📈', label: 'Analytics' },
];

const FILTERS = [
  { label: 'Service', value: 'payment-service' },
  { label: 'Severity', value: 'P0' },
  { label: 'Window', value: 'Last 24h' },
  { label: 'Status', value: 'All' },
];

export default function Dashboard({ incidentId, onTrigger }: DashboardProps) {
  const [status, setStatus] = useState<'idle' | 'running' | 'awaiting_approval' | 'resolved'>(
    incidentId ? 'running' : 'idle',
  );

  return (
    <section id="dashboard" className="bg-bg-dash min-h-screen flex">
      {/* Sidebar (Vendas style) */}
      <aside className="w-60 shrink-0 bg-surface border-r border-white/5 flex flex-col py-6 px-4">
        <div className="flex items-center gap-2 px-3 mb-8">
          <span className="text-xl">🚨</span>
          <span className="font-display font-semibold">IncidentIQ</span>
        </div>

        <nav className="flex flex-col gap-1">
          {NAV.map((n) => (
            <button
              key={n.label}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${
                n.active
                  ? 'gradient-purple text-white font-semibold'
                  : 'text-text-muted hover:text-white hover:bg-white/5'
              }`}
            >
              <span>{n.icon}</span>
              {n.label}
            </button>
          ))}
        </nav>

        <div className="mt-8 px-3">
          <p className="text-[11px] uppercase tracking-wider text-text-muted mb-3">Filters</p>
          <div className="flex flex-col gap-3">
            {FILTERS.map((f) => (
              <div key={f.label}>
                <label className="text-[11px] text-text-muted">{f.label}</label>
                <div className="mt-1 bg-card border border-white/5 rounded-lg px-3 py-2 text-sm text-text-soft flex items-center justify-between">
                  {f.value}
                  <span className="text-text-muted">▾</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-auto px-3">
          <button
            onClick={() => {
              onTrigger();
              setStatus('running');
            }}
            className="w-full gradient-purple glow-purple text-white text-sm font-semibold py-3 rounded-xl hover:scale-[1.02] transition"
          >
            🚨 Trigger Incident
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 p-8 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="font-display text-2xl font-semibold">Incident Performance</h2>
            <p className="text-text-muted text-sm mt-1">
              Real-time multi-agent response · payment-service
            </p>
          </div>
          <div className="flex items-center gap-3">
            {status === 'running' && (
              <span className="flex items-center gap-2 text-accent-cyan text-sm bg-white/5 px-3 py-2 rounded-lg">
                <span className="w-2 h-2 rounded-full bg-accent-cyan animate-pulse" /> Agents active
              </span>
            )}
            {status === 'resolved' && (
              <span className="text-accent-green text-sm bg-white/5 px-3 py-2 rounded-lg font-semibold">
                ✅ Resolved
              </span>
            )}
            <div className="bg-card border border-white/5 rounded-lg px-3 py-2 text-sm text-text-soft">
              Period: 2026 ▾
            </div>
          </div>
        </div>

        {/* KPI cards (Vendas style — value + target progress) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'MTTR', value: '1m 48s', target: 'Target <2m', pct: 94, color: 'text-accent-green' },
            { label: 'Active Incidents', value: '1', target: '3 today', pct: 33, color: 'text-accent-cyan' },
            { label: 'Error Rate', value: '87%', target: 'Threshold 5%', pct: 87, color: 'text-accent-red' },
            { label: 'Cost Saved', value: '$487K', target: 'vs 90m MTTR', pct: 78, color: 'text-accent-purple' },
          ].map((k) => (
            <div key={k.label} className="card-surface rounded-2xl p-5">
              <p className="text-text-muted text-xs uppercase tracking-wider">{k.label}</p>
              <p className={`font-display text-3xl font-semibold mt-2 ${k.color}`}>{k.value}</p>
              <div className="mt-3 h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full gradient-purple rounded-full" style={{ width: `${k.pct}%` }} />
              </div>
              <p className="text-[11px] text-text-muted mt-2">{k.target}</p>
            </div>
          ))}
        </div>

        {/* Row: line chart + donut */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <div className="card-surface rounded-2xl p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">MTTR over time</h3>
              <span className="text-xs text-text-muted">minutes · last 12 incidents</span>
            </div>
            <LineChart points={[8.2, 6.5, 7.1, 5.0, 4.3, 5.5, 3.8, 4.1, 2.9, 3.2, 2.1, 1.8]} />
          </div>
          <div className="card-surface rounded-2xl p-6 flex flex-col items-center justify-center">
            <h3 className="font-semibold mb-4 self-start">Auto-resolve rate</h3>
            <Donut value={82} label="resolved" />
          </div>
        </div>

        {/* Row: live agent feed + incidents by service */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="card-surface rounded-2xl p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Live Agent Feed</h3>
              <span className="text-xs text-text-muted">via Band room</span>
            </div>
            {incidentId ? (
              <AgentTimeline
                incidentId={incidentId}
                onAwaitingApproval={() => setStatus('awaiting_approval')}
                onResolved={() => setStatus('resolved')}
              />
            ) : (
              <div className="text-center py-16 text-text-muted">
                <p className="mb-4">No active incident.</p>
                <button
                  onClick={() => {
                    onTrigger();
                    setStatus('running');
                  }}
                  className="gradient-purple text-white text-sm font-semibold px-6 py-3 rounded-xl"
                >
                  🚨 Trigger Demo Incident
                </button>
              </div>
            )}
          </div>

          <div className="card-surface rounded-2xl p-6">
            <h3 className="font-semibold mb-4">Incidents by service</h3>
            <BarChart
              data={[
                { label: 'payment-svc', value: 12 },
                { label: 'auth-svc', value: 7 },
                { label: 'checkout', value: 5 },
                { label: 'search', value: 3 },
                { label: 'notifications', value: 2 },
              ]}
            />
            <h3 className="font-semibold mt-6 mb-3">Agent activity</h3>
            <div className="flex flex-col gap-2">
              {[
                { icon: '🔍', name: 'Triage', count: '142 runs' },
                { icon: '🕵️', name: 'Investigator', count: '138 runs' },
                { icon: '🔧', name: 'Resolver', count: '129 runs' },
                { icon: '📣', name: 'Notifier', count: '129 runs' },
              ].map((a) => (
                <div key={a.name} className="flex items-center gap-3 bg-white/5 rounded-lg px-3 py-2">
                  <span>{a.icon}</span>
                  <span className="text-sm flex-1">{a.name}</span>
                  <span className="text-xs text-text-muted">{a.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {status === 'awaiting_approval' && incidentId && (
        <ApprovalModal incidentId={incidentId} onApproved={() => setStatus('resolved')} />
      )}
    </section>
  );
}
