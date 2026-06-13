const RUNBOOKS: Record<string, string> = {
  'payment-service': `
# Runbook: payment-service

## P0 — Error rate > 50%
1. Check recent deploys: \`git log --oneline -10\`
2. If deploy < 30 min ago: rollback immediately
   \`kubectl rollout undo deployment/payment-service\`
3. Verify error rate drops within 2 min of rollback
4. Open incident channel #incidents-payment
5. Page on-call lead if not auto-resolved

## P1 — Error rate 10-50%
1. Check Stripe dashboard for upstream issues
2. Review last 3 PRs merged to main
3. Check DB connection pool: \`kubectl exec -it <pod> -- env | grep DB_POOL\`

## Common Errors
- PaymentIntentInvalidParameterError: amount validation removed — check validators.ts
- Stripe rate limit: implement exponential backoff, check STRIPE_RATE_LIMIT env
- DB timeout: scale DB replicas, check connection pool size

## Contacts
- On-call lead: #incidents-payment
- Stripe support: dashboard.stripe.com/support
`,

  'auth-service': `
# Runbook: auth-service

## P0 — Auth failures > 20%
1. Check JWT secret rotation: \`kubectl get secret jwt-secret\`
2. Check Redis session store connectivity
3. Rollback if recent deploy: \`kubectl rollout undo deployment/auth-service\`

## Common Errors
- TokenExpiredError: check clock skew between pods
- RedisConnectionError: check Redis cluster health
`,

  default: `
# Generic Runbook

## P0 Response
1. Identify affected service from Datadog
2. Check recent deploys in the last hour
3. Rollback latest deploy if error correlates with deploy time
4. Escalate to on-call if not resolved in 15 minutes

## Contacts
- #incidents channel on Slack
- On-call rotation: PagerDuty dashboard
`,
};

export async function lookupRunbook(service: string): Promise<string> {
  return RUNBOOKS[service] ?? RUNBOOKS.default;
}
