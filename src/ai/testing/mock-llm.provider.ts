import type {
  LLMProvider,
  ChatMessage,
  GenerateOptions,
  StreamOptions,
  LLMResponse,
  StreamChunk,
  ToolCall,
} from '../provider.interface';

// ─── Mock LLM Response ───────────────────────────────────────────

export type MockResponse =
  | string
  | {
      content?: string;
      toolCall?: { name: string; args: Record<string, unknown> };
    };

export interface MockLLMProviderOptions {
  /** Sequence of responses to return, cycling on exhaustion */
  responses: MockResponse[];
  /** Delay in ms to simulate network latency (default: 0) */
  latencyMs?: number;
}

/**
 * Mock LLM provider for testing agent logic without real API calls.
 *
 * @example
 * ```ts
 * const mock = new MockLLMProvider({
 *   responses: [
 *     { toolCall: { name: 'getUser', args: { id: '1' } } },
 *     'User found: John Doe',
 *   ],
 * });
 * ```
 */
export class MockLLMProvider implements LLMProvider {
  readonly name = 'mock';
  private callIndex = 0;
  private readonly responses: MockResponse[];
  private readonly latencyMs: number;
  readonly calls: Array<{ model: string; messages: ChatMessage[]; options?: GenerateOptions }> = [];

  constructor(options: MockLLMProviderOptions) {
    this.responses = options.responses;
    this.latencyMs = options.latencyMs ?? 0;
  }

  async generate(
    model: string,
    messages: ChatMessage[],
    options?: GenerateOptions,
  ): Promise<LLMResponse> {
    this.calls.push({ model, messages, options });
    if (this.latencyMs > 0) await new Promise((r) => setTimeout(r, this.latencyMs));

    const response = this.responses[this.callIndex % this.responses.length]!;
    this.callIndex++;

    if (typeof response === 'string') {
      return {
        content: response,
        toolCalls: [],
        finishReason: 'stop',
      };
    }

    if (response.toolCall) {
      const toolCall: ToolCall = {
        id: `mock-tool-${this.callIndex}`,
        type: 'function',
        function: {
          name: response.toolCall.name,
          arguments: JSON.stringify(response.toolCall.args),
        },
      };
      return {
        content: response.content ?? null,
        toolCalls: [toolCall],
        finishReason: 'tool_calls',
      };
    }

    return {
      content: response.content ?? '',
      toolCalls: [],
      finishReason: 'stop',
    };
  }

  async *stream(
    model: string,
    messages: ChatMessage[],
    options?: StreamOptions,
  ): AsyncGenerator<StreamChunk> {
    const response = await this.generate(model, messages, options);

    if (response.toolCalls.length > 0) {
      for (const tc of response.toolCalls) {
        yield { type: 'tool_call_start', toolCall: tc };
      }
    } else if (response.content) {
      // Simulate token-by-token streaming
      const words = response.content.split(' ');
      for (const word of words) {
        yield { type: 'text', content: word + ' ' };
        if (this.latencyMs > 0) await new Promise((r) => setTimeout(r, this.latencyMs / 10));
      }
    }

    yield { type: 'done' };
  }

  /** Reset call index and recorded calls */
  reset(): void {
    this.callIndex = 0;
    this.calls.length = 0;
  }

  /** Assert how many times the provider was called */
  get callCount(): number {
    return this.calls.length;
  }
}
