'use client';

import { useEffect, useRef, useState } from 'react';

interface AgentEvent {
  timestamp: string;
  agent: string;
  message: string;
}

interface AgentTimelineProps {
  incidentId: string;
  onAwaitingApproval?: () => void;
  onResolved?: () => void;
}

const AGENT_COLORS: Record<string, string> = {
  triage: 'text-yellow-400',
  investigator: 'text-blue-400',
  resolver: 'text-purple-400',
  notifier: 'text-green-400',
  orchestrator: 'text-gray-400',
};

const AGENT_ICONS: Record<string, string> = {
  triage: '🔍',
  investigator: '🕵️',
  resolver: '🔧',
  notifier: '📣',
  orchestrator: '⚙️',
};

export default function AgentTimeline({ incidentId, onAwaitingApproval, onResolved }: AgentTimelineProps) {
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [status, setStatus] = useState<string>('starting');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const es = new EventSource(`/api/stream?incidentId=${incidentId}`);

    es.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === 'event') {
        setEvents((prev) => [...prev, { timestamp: data.timestamp, agent: data.agent, message: data.message }]);
      }
      if (data.type === 'state') {
        setStatus(data.status);
        if (data.status === 'awaiting_approval') onAwaitingApproval?.();
        if (data.status === 'resolved') onResolved?.();
      }
    };

    es.onerror = () => es.close();
    return () => es.close();
  }, [incidentId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [events]);

  return (
    <div className="flex flex-col gap-2 font-mono text-sm">
      {events.map((e, i) => (
        <div key={i} className="flex gap-3 items-start">
          <span className="text-gray-500 shrink-0 text-xs pt-0.5">
            {new Date(e.timestamp).toLocaleTimeString()}
          </span>
          <span className="shrink-0">{AGENT_ICONS[e.agent] ?? '•'}</span>
          <span className={`${AGENT_COLORS[e.agent] ?? 'text-white'} font-semibold shrink-0`}>
            {e.agent}
          </span>
          <span className="text-gray-300">{e.message}</span>
        </div>
      ))}
      {events.length === 0 && (
        <p className="text-gray-500">Waiting for agents to start...</p>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
