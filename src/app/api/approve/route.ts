import { NextRequest, NextResponse } from 'next/server';
import { getIncidentManager } from '@/orchestrator/incident-manager';

export async function POST(req: NextRequest) {
  const { incidentId, slackChannel } = await req.json();
  if (!incidentId) return NextResponse.json({ error: 'incidentId required' }, { status: 400 });

  const manager = getIncidentManager();
  await manager.approve(incidentId, slackChannel ?? '#incidents');

  return NextResponse.json({ status: 'approved' });
}
