import { Injectable } from '../di/injectable.decorator';
import { Inject } from '../di/inject.decorator';
import { AI_MODULE_CONFIG } from './ai.constants';
import type { AiModuleConfig, StreamChunk, ProviderConfig, LLMProvider } from './provider.interface';
import { AgentRuntime, type AgentRunOptions } from './agent.runtime';
import { OpenAIProvider } from './providers/openai.provider';
import { AnthropicProvider } from './providers/anthropic.provider';
import { GoogleProvider } from './providers/google.provider';
import { Logger } from '../services/logger.service';
import { generateStructured, type StructuredOutputOptions } from './structured-output';
import { WorkflowRuntime, type WorkflowResult } from './workflow';
import { InMemoryMemoryStore } from './memory/in-memory.store';
import type { MemoryStore } from './memory/memory.interface';
import type { TSchema, Static } from '@sinclair/typebox';

/**
 * Injectable AI Service — the primary entry point for using AI in your application.
 * Inject this service and call `run()`, `stream()`, `runTyped()`, or `runWorkflow()`.
 *
 * @example
 * ```ts
 * @Injectable()
 * class MyService {
 *   constructor(private ai: AiService) {}
 *
 *   async chat(message: string, sessionId: string) {
 *     return this.ai.run('SupportAgent', message, { sessionId });
 *   }
 *
 *   async getProduct(query: string) {
 *     return this.ai.runTyped('ProductAgent', query, {
 *       schema: t.Object({ name: t.String(), price: t.Number() }),
 *     });
 *   }
 * }
 * ```
 */
@Injectable()
export class AiService {
  private readonly runtime = new AgentRuntime();
  private readonly logger = new Logger('AiService');
  private readonly memory: MemoryStore;
  private initialized = false;

  constructor(
    @Inject(AI_MODULE_CONFIG) private readonly config: AiModuleConfig,
  ) {
    this.memory = config.memory ?? new InMemoryMemoryStore();
  }

  /**
   * Initialize the AI service — registers providers, tools, agents, and plugins.
   * Called automatically via onModuleInit lifecycle.
   */
  async onModuleInit(): Promise<void> {
    if (this.initialized) return;

    // Register LLM providers
    for (const providerConfig of this.config.providers) {
      const provider = this.createProvider(providerConfig);
      this.runtime.registerProvider(providerConfig.provider, provider);
      this.logger.log(`Registered LLM provider: ${providerConfig.provider}`);
    }

    // Register agents with their tools
    if (this.config.agents) {
      for (const agentClass of this.config.agents) {
        const toolInstances: object[] = [];
        if (this.config.tools) {
          for (const toolClass of this.config.tools) {
            const instance = new (toolClass as new () => object)();
            toolInstances.push(instance);
          }
        }
        this.runtime.registerAgent(agentClass, toolInstances);
      }
    }

    // Register plugins
    if (this.config.plugins) {
      for (const plugin of this.config.plugins) {
        // Each agent gets a reference to the global tool registry via runtime
        await plugin.register(this.runtime.getGlobalToolRegistry());
        this.logger.log(`Registered AI plugin: ${plugin.name}`);
      }
    }

    this.initialized = true;
    this.logger.log('AI Service initialized successfully');
  }

  // ─── Core Run Methods ─────────────────────────────────────────────

  /**
   * Run an agent and get a complete text response.
   * Pass `sessionId` to enable conversation memory across calls.
   */
  async run(
    agentName: string,
    input: string,
    options?: AgentRunOptions & { sessionId?: string },
  ): Promise<string> {
    this.ensureInitialized();
    const history = options?.sessionId ? await this.memory.load(options.sessionId) : undefined;

    const result = await this.runtime.run(agentName, input, { ...options, history });

    if (options?.sessionId) {
      await this.memory.append(options.sessionId, { role: 'user', content: input });
      await this.memory.append(options.sessionId, { role: 'assistant', content: result });
    }

    return result;
  }

  /**
   * Stream an agent's response chunk by chunk.
   * Pass `sessionId` to enable conversation memory.
   */
  async *stream(
    agentName: string,
    input: string,
    options?: AgentRunOptions & { sessionId?: string },
  ): AsyncGenerator<StreamChunk> {
    this.ensureInitialized();
    const history = options?.sessionId ? await this.memory.load(options.sessionId) : undefined;
    let fullResponse = '';

    for await (const chunk of this.runtime.stream(agentName, input, { ...options, history })) {
      if (chunk.type === 'text') fullResponse += chunk.content ?? '';
      yield chunk;
    }

    if (options?.sessionId) {
      await this.memory.append(options.sessionId, { role: 'user', content: input });
      await this.memory.append(options.sessionId, { role: 'assistant', content: fullResponse });
    }
  }

  /**
   * Run an agent and get a **typed**, schema-validated response.
   * Uses TypeBox schema for both validation and JSON Schema generation.
   */
  async runTyped<T extends TSchema>(
    agentName: string,
    input: string,
    options: StructuredOutputOptions<T> & AgentRunOptions & { sessionId?: string },
  ): Promise<Static<T>> {
    this.ensureInitialized();
    const history = options?.sessionId ? await this.memory.load(options.sessionId) : undefined;

    const { providerName, modelName } = this.runtime.parseModelPublic(agentName, options.model);
    const provider = this.runtime.getProviderPublic(providerName);

    const messages = [
      ...(history ?? []),
      { role: 'user' as const, content: input },
    ];

    return generateStructured(provider, modelName, messages, options);
  }

  /**
   * Execute a `@Workflow` decorated class with `@Step` methods.
   */
  async runWorkflow(
    workflowInstance: object,
    initialContext?: Record<string, unknown>,
  ): Promise<WorkflowResult> {
    this.ensureInitialized();
    return WorkflowRuntime.execute(workflowInstance, initialContext);
  }

  /**
   * Clear conversation memory for a session.
   */
  async clearSession(sessionId: string): Promise<void> {
    await this.memory.clear(sessionId);
  }

  /** Get the underlying runtime for advanced use cases */
  getRuntime(): AgentRuntime {
    return this.runtime;
  }

  // ─── Private ────────────────────────────────────────────────────

  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('AiService not initialized. Ensure AiModule is imported in your application.');
    }
  }

  private createProvider(config: ProviderConfig): LLMProvider {
    switch (config.provider) {
      case 'openai':
        return new OpenAIProvider(config.apiKey, config.baseUrl);
      case 'anthropic':
        return new AnthropicProvider(config.apiKey, config.baseUrl);
      case 'google':
        return new GoogleProvider(config.apiKey, config.baseUrl);
      default:
        throw new Error(
          `Unknown AI provider: "${config.provider}". Supported: openai, anthropic, google`,
        );
    }
  }
}
