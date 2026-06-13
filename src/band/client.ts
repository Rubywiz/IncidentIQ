import WebSocket from 'ws';

export type EventType = 'tool_call' | 'tool_result' | 'thought' | 'error' | 'task';

export interface BandMessage {
  id: string;
  content: string;
  sender_id: string;
  room_id: string;
  created_at: string;
  mentions: string[];
}

export interface BandRoom {
  id: string;
  task_id?: string;
}

export class BandClient {
  private baseUrl: string;
  private apiKey: string;
  private agentId?: string;

  constructor(apiKey: string, baseUrl?: string) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl ?? process.env.BAND_BASE_URL ?? 'https://app.band.ai/api/v1/agent';
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey,
        ...options.headers,
      },
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Band API ${path} → ${res.status}: ${text}`);
    }
    if (res.status === 204) return undefined as T;
    return res.json();
  }

  async getMe(): Promise<{ id: string; name: string }> {
    const me = await this.request<{ id: string; name: string }>('/me');
    this.agentId = me.id;
    return me;
  }

  async getPeers(notInChat?: string): Promise<Array<{ id: string; name: string }>> {
    const qs = notInChat ? `?not_in_chat=${notInChat}` : '';
    return this.request(`/peers${qs}`);
  }

  async createRoom(taskId?: string): Promise<BandRoom> {
    return this.request('/chats', {
      method: 'POST',
      body: JSON.stringify(taskId ? { task_id: taskId } : {}),
    });
  }

  async addParticipant(roomId: string, peerId: string): Promise<void> {
    await this.request(`/chats/${roomId}/participants`, {
      method: 'POST',
      body: JSON.stringify({ participant_id: peerId }),
    });
  }

  async sendMessage(roomId: string, content: string, mentionIds: string[]): Promise<BandMessage> {
    return this.request(`/chats/${roomId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content, mentions: mentionIds }),
    });
  }

  async postEvent(roomId: string, type: EventType, data: Record<string, unknown>): Promise<void> {
    await this.request(`/chats/${roomId}/events`, {
      method: 'POST',
      body: JSON.stringify({ type, data }),
    });
  }

  async markProcessing(messageId: string): Promise<void> {
    await this.request(`/messages/${messageId}/processing`, { method: 'POST' });
  }

  async markProcessed(messageId: string): Promise<void> {
    await this.request(`/messages/${messageId}/processed`, { method: 'POST' });
  }

  async markFailed(messageId: string, error: string): Promise<void> {
    await this.request(`/messages/${messageId}/failed`, {
      method: 'POST',
      body: JSON.stringify({ error }),
    });
  }

  async nextMessage(roomId: string): Promise<BandMessage | null> {
    const res = await fetch(`${this.baseUrl}/chats/${roomId}/messages/next`, {
      headers: { 'X-API-Key': this.apiKey },
    });
    if (res.status === 204) return null;
    return res.json();
  }

  async drainBacklog(roomId: string): Promise<BandMessage[]> {
    const messages: BandMessage[] = [];
    while (true) {
      const msg = await this.nextMessage(roomId);
      if (!msg) break;
      messages.push(msg);
    }
    return messages;
  }

  connectWebSocket(
    roomId: string,
    onMessage: (msg: BandMessage) => void,
    onError?: (err: Error) => void,
  ): WebSocket {
    const wsUrl = process.env.BAND_WS_URL ?? 'wss://app.band.ai/api/v1/socket/websocket';
    const ws = new WebSocket(wsUrl, {
      headers: { 'X-API-Key': this.apiKey },
    });

    ws.on('open', () => {
      ws.send(JSON.stringify({ topic: `chat_room:${roomId}`, event: 'phx_join', payload: {}, ref: '1' }));
    });

    ws.on('message', (raw) => {
      try {
        const frame = JSON.parse(raw.toString());
        if (frame.event === 'message_created' && frame.payload?.message) {
          onMessage(frame.payload.message as BandMessage);
        }
      } catch {
        // ignore malformed frames
      }
    });

    ws.on('error', (err) => onError?.(err));
    return ws;
  }
}
