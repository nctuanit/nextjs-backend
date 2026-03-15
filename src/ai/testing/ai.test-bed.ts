import { AgentRuntime, type AgentRunOptions } from '../agent.runtime';
import { MockLLMProvider, type MockLLMProviderOptions } from './mock-llm.provider';
import type { Type } from '../../di/provider';

// ─── AiTestBed ───────────────────────────────────────────────────

export interface AiTestBedOptions {
  /** Agent class(es) to register */
  agents: Type<unknown>[];
  /** Tool class instances to register */
  tools?: object[];
  /** Mock provider configuration */
  mockProvider: MockLLMProviderOptions;
}

/**
 * Test harness for AI agents — creates an isolated runtime with a mock LLM.
 *
 * @example
 * ```ts
 * describe('SupportAgent', () => {
 *   it('calls getUser tool and returns response', async () => {
 *     const bed = AiTestBed.create({
 *       agents: [SupportAgent],
 *       tools: [new UserTools()],
 *       mockProvider: {
 *         responses: [
 *           { toolCall: { name: 'getUser', args: { id: '1' } } },
 *           'Found John Doe',
 *         ],
 *       },
 *     });
 *
 *     const result = await bed.run('SupportAgent', 'find user 1');
 *     expect(result).toBe('Found John Doe');
 *     expect(bed.provider.callCount).toBe(2);
 *   });
 * });
 * ```
 */
export class AiTestBed {
  readonly runtime: AgentRuntime;
  readonly provider: MockLLMProvider;

  private constructor(runtime: AgentRuntime, provider: MockLLMProvider) {
    this.runtime = runtime;
    this.provider = provider;
  }

  static create(options: AiTestBedOptions): AiTestBed {
    const provider = new MockLLMProvider(options.mockProvider);
    const runtime = new AgentRuntime();

    // Register mock provider under all common names
    runtime.registerProvider('mock', provider);
    runtime.registerProvider('openai', provider);
    runtime.registerProvider('anthropic', provider);
    runtime.registerProvider('google', provider);

    // Register agents
    const toolInstances = options.tools ?? [];
    for (const agentClass of options.agents) {
      runtime.registerAgent(agentClass, toolInstances);
    }

    return new AiTestBed(runtime, provider);
  }

  /** Run agent and get text response */
  async run(agentName: string, input: string, options?: AgentRunOptions): Promise<string> {
    return this.runtime.run(agentName, input, options);
  }

  /** Stream agent response */
  async *stream(agentName: string, input: string, options?: AgentRunOptions) {
    yield* this.runtime.stream(agentName, input, options);
  }

  /** Reset provider state between tests */
  reset(): void {
    this.provider.reset();
  }
}
