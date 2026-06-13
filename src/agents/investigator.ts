import { BandClient, BandMessage } from '@/band/client';
import { chat } from '@/band/llm';
import { fetchRecentCommits, fetchPullRequest } from '@/mcp/github';

const SYSTEM_PROMPT = `You are the Investigator Agent for IncidentIQ.

Your job:
1. Receive the Triage report
2. Look at recent commits and deployments in the affected service
3. Identify the most likely culprit PR or deploy that caused the incident
4. Explain WHY you believe this commit/PR is the cause

Format your response as JSON:
{
  "culprit_commit": "sha",
  "culprit_pr": "PR number or null",
  "culprit_author": "github username",
  "deploy_time": "ISO timestamp",
  "change_summary": "what changed in this PR/commit",
  "correlation": "explanation of why this caused the incident",
  "confidence": "high|medium|low",
  "rollback_target": "commit sha to roll back to"
}`;

export class InvestigatorAgent {
  private client: BandClient;

  constructor() {
    this.client = new BandClient(
      process.env.BAND_INVESTIGATOR_KEY!,
      process.env.BAND_BASE_URL,
    );
  }

  async run(roomId: string, triageReport: string, resolverId: string): Promise<string> {
    await this.client.postEvent(roomId, 'thought', {
      agent: 'investigator',
      message: 'Fetching recent commits for affected service...',
    });

    let triageData: { service?: string; first_seen?: string } = {};
    try {
      triageData = JSON.parse(triageReport.match(/\{[\s\S]*\}/)?.[0] ?? '{}');
    } catch {
      // use empty defaults if parse fails
    }

    const service = triageData.service ?? 'payment-service';
    const since = triageData.first_seen ?? new Date(Date.now() - 6 * 3600_000).toISOString();

    const [commits, prs] = await Promise.all([
      fetchRecentCommits(service, since),
      fetchPullRequest(service),
    ]);

    await this.client.postEvent(roomId, 'tool_result', {
      agent: 'investigator',
      commits_checked: commits.length,
      prs_checked: prs.length,
    });

    const userContent = `
TRIAGE REPORT:
${triageReport}

RECENT COMMITS (${service}, since ${since}):
${JSON.stringify(commits, null, 2)}

RECENT PRs:
${JSON.stringify(prs, null, 2)}
`.trim();

    const result = await chat(SYSTEM_PROMPT, userContent, 800);

    const message = await this.client.sendMessage(
      roomId,
      `**INVESTIGATION REPORT**\n\n${result}\n\nHandling off to Resolver — please pull the runbook and draft a fix/rollback plan.`,
      [resolverId],
    );

    return message.id;
  }

  async processIncoming(roomId: string, msg: BandMessage, resolverId: string): Promise<void> {
    await this.client.markProcessing(msg.id);
    try {
      await this.run(roomId, msg.content, resolverId);
      await this.client.markProcessed(msg.id);
    } catch (err) {
      await this.client.markFailed(msg.id, String(err));
      throw err;
    }
  }
}
