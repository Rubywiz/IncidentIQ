import { BandClient, BandMessage } from '@/band/client';
import { chat } from '@/band/llm';
import { fetchDatadogLogs, fetchDatadogMetrics } from '@/mcp/datadog';
import { fetchPagerDutyAlert } from '@/mcp/pagerduty';

const SYSTEM_PROMPT = `You are the Triage Agent for IncidentIQ, an automated incident response system.

Your job:
1. Read raw logs and metrics from Datadog
2. Read the PagerDuty alert that triggered this incident
3. Classify severity: P0 (total outage), P1 (major degradation), P2 (partial issue)
4. Identify the error signature (type, frequency, affected service, first seen)
5. Output a structured triage report

Format your response as a concise JSON object:
{
  "severity": "P0|P1|P2",
  "service": "affected-service-name",
  "error_signature": "short description of the error pattern",
  "error_rate": "X% of requests",
  "first_seen": "ISO timestamp",
  "affected_regions": ["list"],
  "summary": "2-3 sentence human-readable summary",
  "recommended_next": "what the Investigator should look for"
}`;

export class TriageAgent {
  private client: BandClient;

  constructor() {
    this.client = new BandClient(
      process.env.BAND_TRIAGE_KEY!,
      process.env.BAND_BASE_URL,
    );
  }

  async run(roomId: string, incidentId: string, investigatorId: string): Promise<string> {
    await this.client.postEvent(roomId, 'thought', {
      agent: 'triage',
      message: 'Fetching logs and alert data...',
    });

    const [logs, metrics, alert] = await Promise.all([
      fetchDatadogLogs(incidentId),
      fetchDatadogMetrics(incidentId),
      fetchPagerDutyAlert(incidentId),
    ]);

    await this.client.postEvent(roomId, 'tool_result', {
      agent: 'triage',
      sources: ['datadog-logs', 'datadog-metrics', 'pagerduty'],
      log_count: logs.length,
    });

    const userContent = `
PAGERDUTY ALERT:
${JSON.stringify(alert, null, 2)}

DATADOG LOGS (last 50):
${logs.map((l) => `[${l.timestamp}] ${l.level}: ${l.message}`).join('\n')}

DATADOG METRICS:
${JSON.stringify(metrics, null, 2)}
`.trim();

    const result = await chat(SYSTEM_PROMPT, userContent, 800);

    await this.client.postEvent(roomId, 'tool_result', {
      agent: 'triage',
      message: 'Triage complete, notifying Investigator',
    });

    const message = await this.client.sendMessage(
      roomId,
      `**TRIAGE REPORT**\n\n${result}\n\nHandling off to Investigator — please diff recent commits against this error window.`,
      [investigatorId],
    );

    return message.id;
  }

  async processIncoming(roomId: string, msg: BandMessage, investigatorId: string): Promise<void> {
    await this.client.markProcessing(msg.id);
    try {
      await this.run(roomId, msg.content, investigatorId);
      await this.client.markProcessed(msg.id);
    } catch (err) {
      await this.client.markFailed(msg.id, String(err));
      throw err;
    }
  }
}
