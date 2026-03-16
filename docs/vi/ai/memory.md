# Memory System

The AI Memory System provides conversation history persistence for agents, enabling multi-turn conversations across sessions.

## Built-in Stores

### InMemory (default)

```typescript
import { InMemoryStore } from 'next-js-backend/ai';

AiModule.register({
  memory: new InMemoryStore({ maxMessages: 100 }),
})
```

Simple in-process storage. Lost on restart. Ideal for development.

### Redis

```typescript
import { RedisMemoryStore } from 'next-js-backend/ai';
import Redis from 'ioredis';

AiModule.register({
  memory: new RedisMemoryStore({
    client: new Redis(process.env.REDIS_URL),
    ttl: 3600,        // 1 hour session TTL
    prefix: 'ai:msg:', // Redis key prefix
  }),
})
```

Persistent, distributed. Ideal for production.

## Custom Memory Store

Implement the `MemoryStore` interface:

```typescript
import type { MemoryStore, ChatMessage } from 'next-js-backend';

export class PrismaMemoryStore implements MemoryStore {
  async get(sessionId: string): Promise<ChatMessage[]> {
    const messages = await db.message.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
    });
    return messages.map(m => ({ role: m.role, content: m.content }));
  }

  async append(sessionId: string, message: ChatMessage): Promise<void> {
    await db.message.create({
      data: { sessionId, role: message.role, content: message.content as string },
    });
  }

  async clear(sessionId: string): Promise<void> {
    await db.message.deleteMany({ where: { sessionId } });
  }
}
```

# Workflow Engine

The Workflow Engine provides a structured way to define multi-step AI processes with sequential/parallel execution, retries, and conditional branching.

## Defining a Workflow

```typescript
import { Injectable } from 'next-js-backend';
import { Workflow, Step, WorkflowContext } from 'next-js-backend/ai';

@Injectable()
@Workflow({ name: 'OnboardingWorkflow' })
export class OnboardingWorkflow {
  // Step 1: validate user
  @Step({ order: 1 })
  async validateUser(ctx: WorkflowContext) {
    const userId = ctx.get<string>('userId');
    // validate...
    ctx.set('isValid', true);
  }

  // Steps 2a & 2b run in parallel
  @Step({ order: 2, parallel: true })
  async sendWelcomeEmail(ctx: WorkflowContext) {
    // ...
  }

  @Step({ order: 2, parallel: true })
  async createInitialData(ctx: WorkflowContext) {
    // ...
  }

  // Step 3: only runs if user was valid
  @Step({ order: 3, when: (ctx) => ctx.get('isValid') === true })
  async completeOnboarding(ctx: WorkflowContext) {
    // ...
  }

  // Step 4: with retry on failure
  @Step({ order: 4, retries: 3 })
  async notifyAdmin(ctx: WorkflowContext) {
    // ...
  }
}
```

## Running a Workflow

```typescript
import { WorkflowRuntime } from 'next-js-backend/ai';

const result = await WorkflowRuntime.execute(onboardingWorkflow, {
  userId: 'u_123',
});

// result.status: 'completed' | 'failed'
// result.steps: StepResult[]
// result.context: Record<string, unknown>
// result.duration: number (ms)
```

## Step Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `order` | `number` | `0` | Execution order (lower = first) |
| `retries` | `number` | `0` | # of retry attempts on failure |
| `parallel` | `boolean` | `false` | Run with other same-order steps |
| `when` | `(ctx) => boolean` | — | Skip condition |
