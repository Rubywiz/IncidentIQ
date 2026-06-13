import { NextRequest } from 'next/server';
import { getIncidentManager } from '@/orchestrator/incident-manager';

// Server-Sent Events — dashboard polls agent progress in real time.
export async function GET(req: NextRequest) {
  const incidentId = req.nextUrl.searchParams.get('incidentId');

  const encoder = new TextEncoder();
  let closed = false;
  let lastEventCount = 0;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: unknown) => {
        if (closed) return;
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      const poll = async () => {
        while (!closed) {
          const manager = getIncidentManager();
          if (incidentId) {
            const state = manager.getState(incidentId);
            if (state) {
              const newEvents = state.events.slice(lastEventCount);
              newEvents.forEach((e) => send({ type: 'event', ...e }));
              lastEventCount = state.events.length;
              send({ type: 'state', status: state.status, roomId: state.roomId });
              if (state.status === 'resolved' || state.status === 'failed') {
                controller.close();
                return;
              }
            }
          } else {
            send({ type: 'incidents', data: manager.getAllIncidents() });
          }
          await new Promise((r) => setTimeout(r, 1000));
        }
      };

      poll();
    },
    cancel() {
      closed = true;
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
