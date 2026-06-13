/**
 * Demo script — triggers a realistic fake P0 incident end-to-end.
 * Run: npx ts-node demo/run-demo.ts
 *
 * What happens:
 * 1. Orchestrator creates a Band room
 * 2. Triage reads fake Datadog logs + PagerDuty alert → posts report
 * 3. Investigator diffs commits → identifies PR #412 as culprit
 * 4. Resolver pulls runbook → drafts rollback plan, awaits approval
 * 5. (Auto-approve after 5s for demo) → Notifier posts Slack summary
 */

import 'dotenv/config';
import { getIncidentManager } from '../src/orchestrator/incident-manager';

const FAKE_INCIDENT = {
  id: `demo-${Date.now()}`,
  title: 'payment-service: 87% error rate after deploy v2.3.1',
  slackChannel: '#incidents-demo',
};

async function main() {
  console.log('\n🚨 IncidentIQ Demo — Band of Agents Hackathon\n');
  console.log(`Triggering incident: "${FAKE_INCIDENT.title}"\n`);

  const manager = getIncidentManager();

  console.log('--- PHASE 1: Starting agent pipeline ---\n');
  const state = await manager.run(FAKE_INCIDENT);

  console.log(`\n✅ Agents finished. Incident room: ${state.roomId}`);
  console.log(`Status: ${state.status}\n`);

  if (state.status === 'awaiting_approval') {
    console.log('⚠️  Resolution plan posted to Band room. Awaiting human approval...');
    console.log('    (Auto-approving in 5 seconds for demo purposes)\n');
    await new Promise((r) => setTimeout(r, 5000));

    console.log('--- PHASE 2: Human approved — notifying team ---\n');
    await manager.approve(FAKE_INCIDENT.id, FAKE_INCIDENT.slackChannel);
  }

  const final = manager.getState(FAKE_INCIDENT.id)!;
  const mttr = final.resolvedAt
    ? Math.round((new Date(final.resolvedAt).getTime() - new Date(final.startedAt).getTime()) / 1000)
    : null;

  console.log('\n--- INCIDENT RESOLVED ---');
  console.log(`MTTR: ${mttr}s`);
  console.log('\nEvent log:');
  final.events.forEach((e) => console.log(`  [${e.agent}] ${e.message}`));
}

main().catch((err) => {
  console.error('Demo failed:', err);
  process.exit(1);
});
