# Runbook Lookup Skill

Look up the incident runbook for a given service.

## Usage
Call `lookupRunbook(service)` from `src/skills/runbook-lookup.ts`.

## Supported services
- `payment-service` — Stripe payment processing runbooks
- `auth-service` — JWT and session management runbooks
- `default` — Generic P0/P1 response playbook

## Adding a new runbook
Add a new key to the `RUNBOOKS` record in `src/skills/runbook-lookup.ts`.
