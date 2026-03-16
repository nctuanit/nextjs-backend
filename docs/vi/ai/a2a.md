# A2A Protocol

The Agent-to-Agent (A2A) protocol enables seamless communication between AI agents across services. The implementation follows the Google A2A specification.

## A2A Server

Expose your agent as an A2A-compatible endpoint:

```typescript
import { Module } from 'next-js-backend';
import { AiModule, A2AModule } from 'next-js-backend/ai';

@Module({
  imports: [
    AiModule.register({...}),
    A2AModule.register({
      agentName: 'SupportAgent',
      description: 'Customer support AI agent',
    }),
  ],
})
export class AppModule {}
```

### Server Endpoint

```
POST /a2a
```

Handles JSON-RPC 2.0 requests: `tasks/send`, `tasks/get`, `tasks/cancel`.

### Streaming

```
GET /a2a/stream
```

SSE stream of task updates for real-time progress.

## A2A Client

Call any A2A-compatible agent from your services:

```typescript
import { A2AClient } from 'next-js-backend';

const client = new A2AClient('https://other-service.example.com', {
  apiKey: process.env.REMOTE_AGENT_KEY,
  timeoutMs: 30_000,
});

// Send a task and wait for result
const task = await client.sendTask({
  message: { role: 'user', parts: [{ type: 'text', text: 'Help me with order #123' }] }
});

// Streaming response
for await (const chunk of client.streamTask({
  message: { role: 'user', parts: [{ type: 'text', text: 'Write a report' }] }
})) {
  process.stdout.write(chunk);
}
```

## Task Lifecycle

```
submitted → working → [input-required] → completed
                                       → failed
                                       → canceled
```

### Task Management

```typescript
// Check task status
const task = await client.getTask('task-id-here');

// Cancel a task
await client.cancelTask('task-id-here');
```

## Memory & TTL

Completed tasks are stored with a **1-hour TTL** and a **max 1000 tasks** limit (FIFO eviction) to prevent memory leaks in long-running servers.

## Security

Set `REMOTE_AGENT_KEY` to require API key authentication:

```env
REMOTE_AGENT_KEY=your-secret-key
```

The server validates the `x-api-key` header on every request.
