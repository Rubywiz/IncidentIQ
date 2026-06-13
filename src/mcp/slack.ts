// Posts to Slack via incoming webhook or bot token.
// If SLACK_WEBHOOK_URL is set, uses that. Otherwise logs to console (demo mode).
export async function postSlackMessage(channel: string, text: string): Promise<void> {
  const webhook = process.env.SLACK_WEBHOOK_URL;

  if (webhook) {
    const res = await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channel, text }),
    });
    if (!res.ok) throw new Error(`Slack webhook failed: ${res.status}`);
    return;
  }

  // Demo mode — write to stdout so it shows in the demo terminal
  console.log(`\n[SLACK → ${channel}]\n${text}\n`);
}
