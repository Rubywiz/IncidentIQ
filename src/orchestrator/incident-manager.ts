import { BandClient } from '@/band/client';
import { TriageAgent } from '@/agents/triage';
import { InvestigatorAgent } from '@/agents/investigator';
import { ResolverAgent } from '@/agents/resolver';
import { NotifierAgent } from '@/agents/notifier';

export interface IncidentInput {
  id: string;
  title: string;
  slackChannel?: string;
}

export interface IncidentState {
  id: string;
  roomId: string;
  status: 'triaging' | 'investigating' | 'resolving' | 'awaiting_approval' | 'notifying' | 'resolved' | 'failed';
  startedAt: string;
  resolvedAt?: string;
  events: Array<{ timestamp: string; agent: string; message: string }>;
}

// Peer IDs for each agent (used in @mentions — these are the agent identities in Band)
const AGENT_PEERS = {
  triage: process.env.BAND_TRIAGE_KEY!,
  investigator: process.env.BAND_INVESTIGATOR_KEY!,
  resolver: process.env.BAND_RESOLVER_KEY!,
  notifier: process.env.BAND_NOTIFIER_KEY!,
};

export class IncidentManager {
  // Orchestrator uses the Triage agent key to create the room (it acts as "host")
  private band: BandClient;
  private state: Map<string, IncidentState> = new Map();

  constructor() {
    this.band = new BandClient(process.env.BAND_TRIAGE_KEY!, process.env.BAND_BASE_URL);
  }

  private emit(incidentId: string, agent: string, message: string) {
    const state = this.state.get(incidentId);
    if (state) {
      state.events.push({ timestamp: new Date().toISOString(), agent, message });
      // SSE broadcast is handled by the Next.js API route via shared state
      console.log(`[${agent.toUpperCase()}] ${message}`);
    }
  }

  async run(incident: IncidentInput): Promise<IncidentState> {
    const state: IncidentState = {
      id: incident.id,
      roomId: '',
      status: 'triaging',
      startedAt: new Date().toISOString(),
      events: [],
    };
    this.state.set(incident.id, state);

    try {
      // 1. Create Band room for this incident
      this.emit(incident.id, 'orchestrator', `Creating Band room for incident ${incident.id}`);
      const room = await this.band.createRoom(incident.id);
      state.roomId = room.id;

      // Add all agents to the room
      await Promise.all([
        this.band.addParticipant(room.id, AGENT_PEERS.investigator),
        this.band.addParticipant(room.id, AGENT_PEERS.resolver),
        this.band.addParticipant(room.id, AGENT_PEERS.notifier),
      ]);
      this.emit(incident.id, 'orchestrator', `Band room ${room.id} ready — 4 agents joined`);

      // 2. Triage
      state.status = 'triaging';
      this.emit(incident.id, 'triage', 'Starting triage — reading logs and alert data...');
      const triage = new TriageAgent();
      await triage.run(room.id, incident.id, AGENT_PEERS.investigator);
      this.emit(incident.id, 'triage', 'Triage complete');

      // 3. Investigate
      state.status = 'investigating';
      this.emit(incident.id, 'investigator', 'Diffing recent commits...');
      const investigator = new InvestigatorAgent();
      // In a real system, InvestigatorAgent listens on WS for the triage message.
      // For the demo we drive it directly with the last message context.
      const triageContext = `Incident: ${incident.title} (${incident.id})`;
      await investigator.run(room.id, triageContext, AGENT_PEERS.resolver);
      this.emit(incident.id, 'investigator', 'Investigation complete');

      // 4. Resolve (draft plan, await human approval)
      state.status = 'resolving';
      this.emit(incident.id, 'resolver', 'Looking up runbook and drafting resolution plan...');
      const resolver = new ResolverAgent();
      const fullContext = `Incident: ${incident.title}\nService: payment-service\nDeployment: v2.3.1`;
      await resolver.run(room.id, fullContext, 'human-approver', AGENT_PEERS.notifier);
      state.status = 'awaiting_approval';
      this.emit(incident.id, 'resolver', 'Resolution plan posted — awaiting human approval');

    } catch (err) {
      state.status = 'failed';
      this.emit(incident.id, 'orchestrator', `Failed: ${String(err)}`);
      throw err;
    }

    return state;
  }

  async approve(incidentId: string, slackChannel = '#incidents'): Promise<void> {
    const state = this.state.get(incidentId);
    if (!state || state.status !== 'awaiting_approval') {
      throw new Error('Incident not awaiting approval');
    }

    state.status = 'notifying';
    this.emit(incidentId, 'notifier', 'Approval received — posting Slack summary...');
    const notifier = new NotifierAgent();
    await notifier.run(state.roomId, `Incident ${incidentId} resolved`, slackChannel);
    state.status = 'resolved';
    state.resolvedAt = new Date().toISOString();
    this.emit(incidentId, 'notifier', 'Incident resolved and team notified');
  }

  getState(incidentId: string): IncidentState | undefined {
    return this.state.get(incidentId);
  }

  getAllIncidents(): IncidentState[] {
    return Array.from(this.state.values());
  }
}

// Singleton for use across API routes
let _manager: IncidentManager | null = null;
export function getIncidentManager(): IncidentManager {
  _manager ??= new IncidentManager();
  return _manager;
}
