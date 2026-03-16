# AI Module

The AI Module provides a complete, type-safe AI agent system with multi-provider LLM support, built directly into the Next.js Backend framework.

## Features

- 🤖 **AI Agents** — Full agentic loop (prompt → LLM → tool call → response)
- 🔧 **Tool Registry** — Register tools with `@Tool`, automatic input validation via TypeBox
- 🧠 **Memory System** — Conversation history (InMemory or Redis)
- 📐 **Structured Output** — Type-safe JSON generation with auto-retry
- 🔄 **Workflow Engine** — Multi-step processes with `@Workflow` and `@Step`
- 🧩 **Plugin System** — Extend agents with SearchPlugin, DatabasePlugin
- 🌐 **A2A Protocol** — Agent-to-agent communication (Google A2A spec)

## Supported Providers

| Provider | Models |
|----------|--------|
| `openai` | `gpt-4o`, `gpt-4-turbo`, `o1` |
| `anthropic` | `claude-3-5-sonnet-20241022`, `claude-3-haiku` |
| `google` | `gemini-2.0-flash`, `gemini-1.5-pro` |

> All providers use native `fetch` — **zero external SDK dependency**.

## Setup

```typescript
import { Module, AiModule } from 'next-js-backend';

@Module({
  imports: [
    AiModule.register({
      providers: [
        { provider: 'openai', apiKey: process.env.OPENAI_API_KEY! },
      ],
      tools: [UserTools, ProductTools],
      agents: [SupportAgent],
    }),
  ],
})
export class AppModule {}
```

## Defining an Agent

```typescript
import { Agent } from 'next-js-backend';

@Agent({
  name: 'SupportAgent',
  model: 'openai:gpt-4o',
  systemPrompt: 'You are a helpful customer support assistant.',
  maxIterations: 10,
})
export class SupportAgent {}
```

## Defining a Tool

```typescript
import { Injectable, Tool } from 'next-js-backend';
import { Type as t } from '@sinclair/typebox';

@Injectable()
export class UserTools {
  @Tool({
    name: 'get_user',
    description: 'Get user information by ID',
    schema: t.Object({ id: t.String() }),
  })
  async getUser({ id }: { id: string }) {
    return { id, name: 'Nguyen Van A', email: 'a@example.com' };
  }
}
```

::: tip Input Validation
When `schema` is provided, TypeBox validates and coerces input automatically before calling the handler. If invalid, `ToolInputValidationError` is thrown.
:::

## Using AiService

```typescript
import { Injectable, AiService } from 'next-js-backend';

@Injectable()
export class ChatService {
  constructor(private readonly ai: AiService) {}

  // Simple chat
  async chat(message: string) {
    return this.ai.run('SupportAgent', message);
  }

  // Chat with conversation memory
  async chatWithMemory(message: string, sessionId: string) {
    return this.ai.run('SupportAgent', message, { sessionId });
  }

  // Streaming
  async *streamChat(message: string) {
    for await (const chunk of this.ai.stream('SupportAgent', message)) {
      if (chunk.type === 'text') yield chunk.content;
    }
  }
}
```

## Structured Output

```typescript
import { Type as t } from '@sinclair/typebox';

const ProductSchema = t.Object({
  name: t.String(),
  price: t.Number(),
  category: t.String(),
  inStock: t.Boolean(),
});

const result = await this.ai.runTyped('ProductAgent', 'Find iPhone product', {
  schema: ProductSchema,
  temperature: 0,
  retries: 2,
});
// result: { name: string; price: number; category: string; inStock: boolean }
```

## Full Configuration

```typescript
AiModule.register({
  providers: [
    { provider: 'openai', apiKey: '...' },
    { provider: 'anthropic', apiKey: '...' },
    { provider: 'google', apiKey: '...' },
    // Custom baseUrl (e.g. Azure OpenAI)
    { provider: 'openai', apiKey: '...', baseUrl: 'https://my-azure.openai.azure.com' },
  ],
  tools: [UserTools, ProductTools, OrderTools],
  agents: [SupportAgent, SalesAgent],
  memory: new RedisMemoryStore({ client: redisClient, ttl: 3600 }),
  plugins: [
    new SearchPlugin({ apiKey: process.env.TAVILY_API_KEY! }),
    new DatabasePlugin({ query: (sql) => db.$queryRawUnsafe(sql), allowedTables: ['users'] }),
  ],
})
```
