import { NextResponse } from 'next/server';
import { getIncidentManager } from '@/orchestrator/incident-manager';

export async function GET() {
  const manager = getIncidentManager();
  return NextResponse.json(manager.getAllIncidents());
}
