# Agents & Tools

## How Agents Work

An agent uses an iterative **agentic loop**:

1. Receive user message
2. Send to LLM with available tools
3. If LLM calls a tool → execute it, append result to context
4. Repeat steps 2-3 until LLM produces a final text response
5. Return response

```
User message → LLM → (tool call?) → Tool execution → LLM → Response
                 ↑___________________________|
                        (loop until done)
```

## Defining an Agent

```typescript
import { Agent } from 'next-js-backend';

@Agent({
  model: 'openai:gpt-4o',
  systemPrompt: `You are a helpful customer support agent.
  Use the available tools to look up orders and users.
  Always be polite and concise.`,
  tools: [OrderTools, UserTools],
  maxIterations: 15,  // Safety limit for tool call loops
})
export class SupportAgent {}
```

### AgentOptions

| Option | Type | Description |
|--------|------|-------------|
| `model` | `string` | `provider:model-name` |
| `systemPrompt` | `string` | System message for the LLM |
| `tools` | `Type[]` | Tool classes available to this agent |
| `memory` | `Type` | Memory class for conversation context |
| `maxIterations` | `number` | Max tool call loop iterations (default: 10) |

## Defining Tools

```typescript
import { Injectable, Tool } from 'next-js-backend';
import { Type as t } from '@sinclair/typebox';

@Injectable()
export class OrderTools {
  constructor(private readonly orderRepo: OrderRepository) {}

  @Tool({
    description: 'Get order details by order ID',
    schema: t.Object({
      orderId: t.String({ description: 'The order ID (starts with ORD-)' }),
    }),
  })
  async getOrder({ orderId }: { orderId: string }) {
    const order = await this.orderRepo.findById(orderId);
    if (!order) return { error: 'Order not found' };
    return order;
  }

  @Tool({
    description: 'List recent orders for a customer',
    schema: t.Object({
      customerId: t.String(),
      limit: t.Optional(t.Number({ minimum: 1, maximum: 20 })),
    }),
  })
  async listOrders({ customerId, limit = 10 }: { customerId: string; limit?: number }) {
    return this.orderRepo.findByCustomer(customerId, { limit });
  }
}
```

## Running Agents

```typescript
@Injectable()
export class ChatService {
  constructor(private readonly ai: AiService) {}

  // Single response
  async ask(message: string) {
    return this.ai.run('SupportAgent', message);
  }

  // With conversation memory (sessionId for history)
  async chat(message: string, sessionId: string) {
    return this.ai.run('SupportAgent', message, { sessionId });
  }

  // Streaming response
  async *stream(message: string) {
    for await (const chunk of this.ai.stream('SupportAgent', message)) {
      if (chunk.type === 'text') yield chunk.content;
      if (chunk.type === 'tool_call') {
        Logger.log('Tool called:', chunk.toolName);
      }
    }
  }
}
```

## Multi-Agent Orchestration

Run multiple agents in sequence:

```typescript
async orchestrate(topic: string) {
  // Research agent gathers information
  const research = await this.ai.run('ResearchAgent', `Research: ${topic}`);
  
  // Writer agent generates content from research
  const content = await this.ai.run('WriterAgent',
    `Write a blog post based on this research: ${research.content}`
  );
  
  return content;
}
```

## Error Handling

```typescript
try {
  const result = await this.ai.run('SupportAgent', message);
  return result;
} catch (e) {
  if (e instanceof ToolInputValidationError) {
    // Tool received invalid arguments from LLM
    console.error('Tool validation:', e.errors);
  }
  throw e;
}
```
