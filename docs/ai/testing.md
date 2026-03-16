# Testing AI

Testing AI agents and tools requires control over LLM responses. The library provides `MockLLMProvider` and `AiTestBed` for deterministic testing.

## MockLLMProvider

A drop-in replacement for real LLM providers with full response control:

```typescript
import { MockLLMProvider } from 'next-js-backend/ai/testing';

describe('SupportAgent', () => {
  let mock: MockLLMProvider;

  beforeEach(() => {
    mock = new MockLLMProvider({
      defaultResponse: 'I can help you with that.',
      latencyMs: 0, // instant responses
    });
  });

  it('returns configured response', async () => {
    mock.setResponse('hello', 'Hello! How can I help?');
    const result = await mock.generate('openai:gpt-4o', [
      { role: 'user', content: 'hello' }
    ], {});
    expect(result.content).toBe('Hello! How can I help?');
  });
});
```

## Testing Tool Calls

Simulate the agent calling a tool and returning a result:

```typescript
it('should call get_order tool', async () => {
  const mock = new MockLLMProvider();

  // 1st call: agent decides to use a tool
  mock.setNextToolCall('get_order', { orderId: 'ORD-123' });
  // 2nd call: after tool result, agent responds
  mock.setNextResponse('Order ORD-123 is being shipped to Hanoi.');

  const registry = new ToolRegistry();
  registry.registerToolClass(orderToolsInstance);

  const runtime = new AgentRuntime({
    provider: mock,
    registry,
    maxIterations: 5,
  });

  const result = await runtime.run('SupportAgent', 'Where is my order ORD-123?');
  expect(result.content).toContain('shipped');
  expect(mock.callCount).toBe(2);
});
```

## Testing Tool Handlers Directly

Test tool handlers in isolation (no LLM needed):

```typescript
import { ToolRegistry } from 'next-js-backend/ai';

describe('OrderTools', () => {
  let registry: ToolRegistry;

  beforeEach(() => {
    const tools = new OrderTools(mockOrderRepo);
    registry = new ToolRegistry();
    registry.registerToolClass(tools);
  });

  it('returns order details', async () => {
    mockOrderRepo.findById.mockResolvedValue({ id: 'ORD-1', status: 'shipped' });
    
    const result = await registry.executeTool('get_order', { orderId: 'ORD-1' });
    expect(result).toMatchObject({ id: 'ORD-1', status: 'shipped' });
  });

  it('validates tool input', async () => {
    await expect(
      registry.executeTool('get_order', { orderId: 123 }) // wrong type
    ).rejects.toThrow(ToolInputValidationError);
  });
});
```

## Testing Structured Output

```typescript
import { generateStructured } from 'next-js-backend/ai';
import { MockLLMProvider } from 'next-js-backend/ai/testing';
import { Type as t } from '@sinclair/typebox';

it('parses structured output correctly', async () => {
  const mock = new MockLLMProvider();
  mock.setNextResponse('{"name": "Alice", "age": 30}');

  const result = await generateStructured(mock, 'openai:gpt-4o', [
    { role: 'user', content: 'Get user info' }
  ], {
    schema: t.Object({ name: t.String(), age: t.Number() }),
  });

  expect(result.name).toBe('Alice');
  expect(result.age).toBe(30);
});

it('retries on invalid JSON', async () => {
  const mock = new MockLLMProvider();
  mock.setNextResponse('not json at all');          // fail
  mock.setNextResponse('{"name": "Bob", "age": 25}'); // success on retry

  const result = await generateStructured(mock, 'model', messages, {
    schema: t.Object({ name: t.String(), age: t.Number() }),
    retries: 1,
  });

  expect(result.name).toBe('Bob');
  expect(mock.callCount).toBe(2); // 1 fail + 1 retry
});
```

## MockLLMProvider API

| Method | Description |
|--------|-------------|
| `setResponse(prompt, response)` | Set response for a specific prompt match |
| `setNextResponse(response)` | Queue a response for the next call |
| `setNextToolCall(toolName, args)` | Queue a tool call for the next LLM call |
| `setNextError(error)` | Queue an error for the next call |
| `callCount` | Number of times the provider was called |
| `lastCall` | Last `{ model, messages, options }` input |
| `toolCalls` | Array of tool names called in agentic runs |
| `reset()` | Clear all queued responses and counters |
