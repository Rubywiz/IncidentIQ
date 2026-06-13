@AGENTS.md

# IncidentIQ — Agent System

## Overview
Multi-agent incident response system for the Band of Agents Hackathon (Track 3).
Four subagents coordinate through Band rooms to triage, investigate, resolve, and notify on production incidents.

## Agent Roles

| Agent | File | Band Key Env | Responsibility |
|-------|------|-------------|----------------|
| Triage | `src/agents/triage.ts` | `BAND_TRIAGE_KEY` | Read logs/metrics, classify severity, identify error signature |
| Investigator | `src/agents/investigator.ts` | `BAND_INVESTIGATOR_KEY` | Diff commits, identify culprit PR/deploy |
| Resolver | `src/agents/resolver.ts` | `BAND_RESOLVER_KEY` | Look up runbook, draft fix/rollback plan |
| Notifier | `src/agents/notifier.ts` | `BAND_NOTIFIER_KEY` | Post Slack summary, close incident |

## Tool Permissions

Each agent may ONLY use its designated tools:
- **Triage**: `fetchDatadogLogs`, `fetchDatadogMetrics`, `fetchPagerDutyAlert`, `BandClient.sendMessage`
- **Investigator**: `fetchRecentCommits`, `fetchPullRequest`, `BandClient.sendMessage`
- **Resolver**: `lookupRunbook`, `BandClient.sendMessage` — MAY NOT deploy or run destructive commands
- **Notifier**: `postSlackMessage`, `BandClient.sendMessage`

## Safety Rules (ENFORCED)

1. **No auto-deploy**: Resolver produces a PLAN only. Human must approve before execution.
2. **No destructive commands without approval**: `kubectl rollout undo`, `git revert`, `terraform destroy` require explicit human sign-off in Band.
3. **Audit trail**: All agent decisions logged as Band events (`tool_call`, `tool_result`, `thought`).
4. **Fail safe**: If any agent fails, it calls `markFailed(messageId)` — never silently drops an incident.

## Band Coordination Pattern

```
Alert fires
    ↓
Orchestrator creates Band room → adds all 4 agents
    ↓
Triage runs → posts report @mentioning Investigator
    ↓
Investigator runs → posts report @mentioning Resolver
    ↓
Resolver runs → posts plan @mentioning human approver  ← HUMAN GATE
    ↓ (after approval)
Notifier runs → posts Slack summary, closes room
```

## Environment Variables

See `.env.example`. Required:
- `BAND_TRIAGE_KEY`, `BAND_INVESTIGATOR_KEY`, `BAND_RESOLVER_KEY`, `BAND_NOTIFIER_KEY`
- `FEATHERLESS_API_KEY` — LLM inference (OpenAI-compatible)
- `GITHUB_TOKEN` — real commit diffs (optional, falls back to demo data)

## Running Locally

```bash
npm run dev                        # Start Next.js dashboard on localhost:3000
npx ts-node demo/run-demo.ts       # Trigger a fake P0 incident end-to-end
```
