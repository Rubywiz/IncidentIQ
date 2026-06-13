export interface DatadogLog {
  timestamp: string;
  level: 'ERROR' | 'WARN' | 'INFO';
  service: string;
  message: string;
  trace_id?: string;
}

export interface DatadogMetrics {
  error_rate: number;
  p99_latency_ms: number;
  request_rate: number;
  apdex: number;
}

// Returns realistic fake logs for demo. Swap this for a real Datadog API call.
export async function fetchDatadogLogs(incidentId: string): Promise<DatadogLog[]> {
  const base = new Date('2026-06-13T05:45:00Z');
  const logs: DatadogLog[] = [];

  for (let i = 0; i < 50; i++) {
    const t = new Date(base.getTime() + i * 6000);
    const isError = i > 10;
    logs.push({
      timestamp: t.toISOString(),
      level: isError ? 'ERROR' : 'INFO',
      service: 'payment-service',
      message: isError
        ? `[payment-service] Stripe charge failed: PaymentIntentInvalidParameterError — amount must be > 0 (trace=${incidentId.slice(0, 8)})`
        : `[payment-service] POST /v1/charges 200 OK 142ms`,
      trace_id: isError ? `trace-${incidentId.slice(0, 8)}-${i}` : undefined,
    });
  }
  return logs;
}

export async function fetchDatadogMetrics(incidentId: string): Promise<DatadogMetrics> {
  return {
    error_rate: 0.87,
    p99_latency_ms: 4320,
    request_rate: 1240,
    apdex: 0.12,
  };
}
