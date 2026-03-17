# Server-Sent Events (SSE)

SSE provides a lightweight one-way streaming mechanism from server to client — ideal for real-time notifications, live feeds, and AI chat streams.

## Basic SSE Endpoint

```typescript
import { Controller, Sse } from 'next-js-backend';

@Controller('/events')
export class EventsController {
  @Sse('/live')
  async *liveEvents() {
    let counter = 0;
    while (true) {
      yield { data: JSON.stringify({ count: counter++ }) };
      await new Promise(r => setTimeout(r, 1000));
    }
  }
}
```

The `@Sse` decorator automatically sets `Content-Type: text/event-stream` and handles the SSE protocol formatting.

## Typed Event Stream

```typescript
@Sse('/notifications')
async *notifications() {
  yield { event: 'connected', data: 'Stream started' };

  for await (const notification of this.notificationService.subscribe()) {
    yield {
      event: notification.type,
      data: JSON.stringify(notification.payload),
      id: notification.id,
    };
  }
}
```

## AI Chat Streaming

```typescript
@Controller('/ai')
export class AiController {
  constructor(private readonly ai: AiService) {}

  @Sse('/stream')
  async *streamChat(@Query('message') message: string) {
    for await (const chunk of this.ai.stream('SupportAgent', message)) {
      if (chunk.type === 'text') {
        yield { data: JSON.stringify({ content: chunk.content }) };
      }
    }
    yield { event: 'done', data: '{}' };
  }
}
```

## Client-side

```javascript
const es = new EventSource('/events/live');

es.onmessage = ({ data }) => {
  Logger.log(JSON.parse(data));
};

es.addEventListener('notification', ({ data }) => {
  showNotification(JSON.parse(data));
});

es.onerror = () => es.close();
```

## SSE Event Fields

| Field | Description |
|-------|-------------|
| `data` | The payload (string) |
| `event` | Named event type (optional) |
| `id` | Event ID for reconnection (optional) |
| `retry` | Reconnection delay in ms (optional) |
