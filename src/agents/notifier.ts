import { BandClient, BandMessage } from '@/band/client';
import { chat } from '@/band/llm';
import { postSlackMessage } from '@/mcp/slack';

const SYSTEM_PROMPT = `You are the Notifier Agent for IncidentIQ.

Your job:
1. Receive the full incident context (triage + investigation + resolution plan + approval)
2. Write a clear, structured incident summary for the engineering team
3. Format it for Slack (use Slack mrkdwn)

Format:
*🚨 Incident Resolved — <SERVICE>*

*Summary:* 1-2 sentences on what happened
*Root Cause:* culprit PR/commit + author
*Resolution:* what was done
*Timeline:*
• Alert fired: <time>
• Triage complete: <time>
• Root cause identified: <time>
• Resolution approved: <time>
• Resolved: <time>
*MTTR:* X minutes
*Action items:* (if any)

Keep it factual and concise. Engineers are still stressed.`;

export class NotifierAgent {
  private client: BandClient;

  constructor() {
    this.client = new BandClient(
      process.env.BAND_NOTIFIER_KEY!,
      process.env.BAND_BASE_URL,
    );
  }

  async run(roomId: string, fullContext: string, slackChannel: string): Promise<void> {
    await this.client.postEvent(roomId, 'thought', {
      agent: 'notifier',
      message: 'Drafting incident summary...',
    });

    const slackSummary = await chat(SYSTEM_PROMPT, fullContext, 600);

    await postSlackMessage(slackChannel, slackSummary);

    await this.client.postEvent(roomId, 'tool_result', {
      agent: 'notifier',
      message: 'Slack notification sent',
      channel: slackChannel,
    });

    await this.client.sendMessage(
      roomId,
      `✅ Incident summary posted to Slack channel ${slackChannel}.\n\n${slackSummary}`,
      [],
    );
  }

  async processIncoming(
    roomId: string,
    msg: BandMessage,
    slackChannel: string,
  ): Promise<void> {
    await this.client.markProcessing(msg.id);
    try {
      await this.run(roomId, msg.content, slackChannel);
      await this.client.markProcessed(msg.id);
    } catch (err) {
      await this.client.markFailed(msg.id, String(err));
      throw err;
    }
  }
}
