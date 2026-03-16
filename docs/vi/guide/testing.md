# Testing

## Testing Utilities

next-js-backend ships with first-class testing utilities to make unit and E2E testing simple.

### TestingModule

Create isolated DI containers for unit testing:

```typescript
import { TestingModule } from 'next-js-backend';
import { UserService } from './user.service';

describe('UserService', () => {
  let service: UserService;

  beforeEach(async () => {
    const module = await TestingModule.create({
      providers: [
        UserService,
        { provide: 'DB', useValue: mockDb },
      ],
    });
    service = module.get(UserService);
  });

  it('should find user', async () => {
    const user = await service.findById('u_1');
    expect(user).toBeDefined();
  });
});
```

---

## AI Testing Utilities

### AiTestBed

```typescript
import { AiTestBed } from 'next-js-backend/ai/testing';
import { MockLLMProvider } from 'next-js-backend/ai/testing';

const bed = new AiTestBed();
const mock = new MockLLMProvider();

// Preset responses
mock.setResponse('What is 2+2?', '4');
mock.setNextResponse('{ "name": "Alice" }');
```

### MockLLMProvider

```typescript
import { MockLLMProvider } from 'next-js-backend/ai/testing';

const llm = new MockLLMProvider({
  defaultResponse: 'I am a helpful assistant.',
  latencyMs: 0,  // instant for tests
});

// Set exact response per prompt
llm.setResponse('ping', 'pong');

// Force the next call to throw
llm.setNextError(new Error('Rate limited'));

// Inspect calls
expect(llm.callCount).toBe(1);
expect(llm.lastCall?.messages[0].content).toBe('ping');
```

### Testing Agents

```typescript
import { AgentRuntime } from 'next-js-backend/ai';
import { MockLLMProvider, AiTestBed } from 'next-js-backend/ai/testing';

it('should call the get_user tool', async () => {
  const mock = new MockLLMProvider();
  mock.setNextToolCall('get_user', { id: 'u_1' });
  mock.setNextResponse('User found: Alice');

  const runtime = new AgentRuntime({ provider: mock });
  const result = await runtime.run('SupportAgent', 'Find user with id u_1');

  expect(result.content).toContain('Alice');
  expect(mock.toolCalls).toContain('get_user');
});
```

## E2E Testing

```typescript
import { ElysiaFactory } from 'next-js-backend';
import { AppModule } from './app.module';

describe('App E2E', () => {
  let app: any;

  beforeAll(async () => {
    app = await ElysiaFactory.create(AppModule);
  });

  it('GET / returns 200', async () => {
    const res = await app.handle(new Request('http://localhost/'));
    expect(res.status).toBe(200);
  });
});
```
