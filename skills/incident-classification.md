# Incident Classification Skill

## Severity levels

| Level | Criteria | Target MTTR |
|-------|----------|-------------|
| P0 | >50% error rate, full outage, revenue impact | <15 min |
| P1 | 10–50% error rate, major degradation | <30 min |
| P2 | <10% error rate, partial issue | <2 hours |

## Classification logic (Triage Agent)
1. Check `error_rate` from Datadog metrics
2. Check PagerDuty alert severity field
3. Check number of affected regions
4. Use the highest severity indicated by any signal

## Output format
The Triage Agent produces a JSON triage report — see `src/agents/triage.ts` for the schema.
