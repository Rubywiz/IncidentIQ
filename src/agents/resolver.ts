import { BandClient, BandMessage } from '@/band/client';
import { chat } from '@/band/llm';
import { lookupRunbook } from '@/skills/runbook-lookup';

const SYSTEM_PROMPT = `You are the Resolver Agent for IncidentIQ.

Your job:
1. Receive both the Triage and Investigation reports
2. Look up the relevant runbook for this service/error type
3. Draft a resolution plan — either a targeted fix or a rollback
4. Present this plan clearly for human approval (NO auto-deploy)

CRITICAL RULE: You must NEVER suggest executing a deploy, rollback, or destructive command yourself.
Your output is a PLAN that a human must approve before execution.

Format your response as JSON:
{
  "resolution_type": "rollback|hotfix|config_change|escalate",
  "plan": {
    "steps": ["ordered list of steps"],
    "rollback_command": "exact command if rollback",
    "estimated_recovery_time": "X minutes",
    "risk_level": "low|medium|high"
  },
  "runbook_reference": "section/page used",
  "requires_human_approval": true,
  "approval_prompt": "Plain English question to show the human approver"
}`;

export class ResolverAgent {
  private client: BandClient;

  constructor() {
    this.client = new BandClient(
      process.env.BAND_RESOLVER_KEY!,
      process.env.BAND_BASE_URL,
    );
  }

  async run(
    roomId: string,
    fullContext: string,
    humanApproverId: string,
    notifierId: string,
  ): Promise<string> {
    await this.client.postEvent(roomId, 'thought', {
      agent: 'resolver',
      message: 'Looking up runbook...',
    });

    let investigation: { culprit_commit?: string; service?: string } = {};
    try {
      investigation = JSON.parse(fullContext.match(/\{[\s\S]*\}/)?.[0] ?? '{}');
    } catch {
      // ignore
    }

    const service = investigation.service ?? 'payment-service';
    const runbook = await lookupRunbook(service);

    await this.client.postEvent(roomId, 'tool_result', {
      agent: 'resolver',
      runbook_found: !!runbook,
      service,
    });

    const userContent = `
INCIDENT CONTEXT:
${fullContext}

RUNBOOK (${service}):
${runbook}
`.trim();

    const result = await chat(SYSTEM_PROMPT, userContent, 1000);

    let plan: { approval_prompt?: string } = {};
    try {
      plan = JSON.parse(result.match(/\{[\s\S]*\}/)?.[0] ?? '{}');
    } catch {
      // ignore
    }

    const approvalPrompt = plan.approval_prompt ?? 'Approve resolution plan?';

    const message = await this.client.sendMessage(
      roomId,
      `**RESOLUTION PLAN** *(awaiting human approval)*\n\n${result}\n\n---\n⚠️ **Human approval required:** ${approvalPrompt}\n\nPinging @notifier once approved.`,
      [humanApproverId],
    );

    return message.id;
  }

  async processIncoming(
    roomId: string,
    msg: BandMessage,
    humanApproverId: string,
    notifierId: string,
  ): Promise<void> {
    await this.client.markProcessing(msg.id);
    try {
      await this.run(roomId, msg.content, humanApproverId, notifierId);
      await this.client.markProcessed(msg.id);
    } catch (err) {
      await this.client.markFailed(msg.id, String(err));
      throw err;
    }
  }
}
