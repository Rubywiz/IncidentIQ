export interface PagerDutyAlert {
  id: string;
  title: string;
  severity: string;
  service: string;
  triggered_at: string;
  details: string;
}

// Returns a realistic fake PagerDuty alert. Swap for real PagerDuty API call.
export async function fetchPagerDutyAlert(incidentId: string): Promise<PagerDutyAlert> {
  return {
    id: incidentId,
    title: 'payment-service: error rate > 80% (P0)',
    severity: 'critical',
    service: 'payment-service',
    triggered_at: new Date('2026-06-13T05:56:00Z').toISOString(),
    details:
      'Error rate spiked from 0.1% to 87% over 5 minutes. ' +
      'PaymentIntentInvalidParameterError flooding logs. ' +
      'Deploy v2.3.1 went out at 05:44 UTC.',
  };
}
