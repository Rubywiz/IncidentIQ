'use client';

import { useRef, useState } from 'react';
import Hero from '@/components/Hero';
import Dashboard from '@/components/Dashboard';

export default function Home() {
  const [incidentId, setIncidentId] = useState<string | null>(null);
  const dashboardRef = useRef<HTMLDivElement>(null);

  const scrollToDashboard = () => {
    dashboardRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const triggerIncident = async () => {
    const res = await fetch('/api/trigger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'payment-service: 87% error rate after deploy v2.3.1',
        slackChannel: '#incidents-demo',
      }),
    });
    const data = await res.json();
    setIncidentId(data.incidentId);
    scrollToDashboard();
  };

  return (
    <main>
      <Hero onLaunch={scrollToDashboard} onTrigger={triggerIncident} />
      <div ref={dashboardRef}>
        <Dashboard incidentId={incidentId} onTrigger={triggerIncident} />
      </div>
    </main>
  );
}
