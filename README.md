# 🚨 IncidentIQ

**Multi-agent incident response system** — built for the [Band of Agents Hackathon](https://lablab.ai) (June 12–19, 2026), Track 3: Regulated & High-Stakes Workflows.

When production goes down, engineers scramble across Slack, Datadog, GitHub, and PagerDuty with no shared context. MTTR averages 45–90 minutes; downtime costs ~$5,600/minute. IncidentIQ spins up a **Band room** the moment an alert fires and coordinates four agents to resolve P0s in **under two minutes** — with a human approval gate before anything is executed.

## The agents

| Agent | Role | Tools |
|-------|------|-------|
| 🔍 **Triage** | Reads logs, classifies severity, identifies error signature | Datadog, PagerDuty |
| 🕵️ **Investigator** | Diffs recent commits, flags the culprit PR/deploy | GitHub |
| 🔧 **Resolver** | Pulls runbook, drafts fix/rollback, pings human for approval | Runbook skill, Band |
| 📣 **Notifier** | Posts structured summary to Slack/Band, manages escalation | Slack, Band |

**Band** is the coordination layer — agents post findings to a shared room via `@mentions`, hand off context, and wait on each other before escalating to a human.

## Architecture

```
Alert fires
    ↓
Orchestrator creates Band room → adds all 4 agents
    ↓
Triage → posts report @mentioning Investigator
    ↓
Investigator → posts report @mentioning Resolver
    ↓
Resolver → posts plan @mentioning human approver   ← HUMAN GATE (no auto-deploy)
    ↓ (after approval)
Notifier → posts Slack summary, closes room
```

## Stack

- **Next.js 16** (App Router) + TypeScript + Tailwind v4 — real-time dashboard with SSE agent feed
- **Band Agent API** — room coordination, `@mention` routing, WebSocket, message lifecycle
- **Featherless** (OpenAI-compatible) — LLM inference
- **MCP adapters** — Datadog, PagerDuty, GitHub, Slack
- **Claude Code** — `CLAUDE.md` agent roles, skills, and a `PreToolUse` hook that blocks destructive commands without approval

## Design

The UI combines two Figma references into one cohesive dark theme:
- **Hero** — Serendale.ai blockchain landing (glowing wireframe orb, magenta→cyan gradients, Clash Grotesk)
- **Dashboard** — Power BI "Vendas" dashboard (KPI cards, charts, sidebar, ranked panels)

## Running locally

```bash
cp .env.example .env.local   # fill in your Band + Featherless keys
npm install
npm run dev                  # dashboard at http://localhost:3000
```

Trigger an end-to-end demo incident:

```bash
npx ts-node demo/run-demo.ts
```

## Safety (Track 3 fit)

1. **No auto-deploy** — Resolver produces a *plan*; a human approves before execution.
2. **Destructive-command hook** — `kubectl rollout undo`, `terraform destroy`, etc. are blocked without sign-off.
3. **Full audit trail** — every agent decision and tool call is logged as a Band event.
4. **Fail safe** — agents mark messages failed rather than silently dropping an incident.

---

Built with [Claude Code](https://claude.com/claude-code).
