import { NextRequest, NextResponse } from 'next/server';
import { getIncidentManager } from '@/orchestrator/incident-manager';
import { v4 as uuid } from 'uuid';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const incident = {
    id: body.id ?? uuid(),
    title: body.title ?? 'Untitled incident',
    slackChannel: body.slackChannel ?? '#incidents',
  };

  // Fire and forget — state is tracked in the manager
  const manager = getIncidentManager();
  manager.run(incident).catch((err) => console.error('Incident failed:', err));

  return NextResponse.json({ incidentId: incident.id, status: 'started' });
}
