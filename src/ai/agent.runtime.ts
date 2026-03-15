import 'reflect-metadata';
import { AI_AGENT_METADATA } from './ai.constants';
import type { AgentOptions } from './ai.decorators';
import type {
  LLMProvider,
  ChatMessage,
  StreamChunk,
  ToolCall,
} from './provider.interface';
import { ToolRegistry } from './tool.registry';
import { Logger } from '../services/logger.service';
import type { Type } from '../di/provider';

export interface AgentRunOptions {
  /** Override the agent's default model */
  model?: string;
  /** Additional system prompt (appended to the agent's systemPrompt) */
  systemPrompt?: string;
  /** Conversation history to continue from */
  history?: ChatMessage[];
  /** Override max iterations */
  maxIterations?: number;
  /** Temperature override */
  temperature?: number;
  /** Max tokens override */
  maxTokens?: number;
}

export interface AgentEntry {
  name: string;
  options: AgentOptions;
  toolRegistry: ToolRegistry;
}

/**
 * Agent Runtime — orchestrates the agentic loop:
 * prompt → LLM → tool_call → execute → return
 */
export class AgentRuntime {
  private static readonly logger = new Logger('AgentRuntime');
  private agents = new Map<string, AgentEntry>();
  private providers = new Map<string, LLMProvider>();
  /** Shared global tool registry — used by plugins */
  private readonly globalRegistry = new ToolRegistry();

  /** Register an LLM provider */
  registerProvider(name: string, provider: LLMProvider): void {
    this.providers.set(name, provider);
  }

  /** Get the global tool registry (for plugin registration) */
  getGlobalToolRegistry(): ToolRegistry {
    return this.globalRegistry;
  }

  /** Parse "provider:model" — public accessor for AiService */
  parseModelPublic(_agentName: string, model?: string): { providerName: string; modelName: string } {
    // If model override provided, use it; otherwise look up from agent options
    const agentEntry = this.agents.get(_agentName);
    const effectiveModel = model || agentEntry?.options.model || '';
    return this.parseModel(effectiveModel);
  }

  /** Get a provider by name — public accessor for AiService */
  getProviderPublic(name: string): LLMProvider {
    return this.getProvider(name);
  }

  /** Register an agent from a decorated class */
  registerAgent(agentClass: Type<unknown>, toolInstances: object[]): void {
    const agentOptions: AgentOptions | undefined = Reflect.getMetadata(
      AI_AGENT_METADATA,
      agentClass,
    );

    if (!agentOptions) {
      throw new Error(`${agentClass.name} is not decorated with @Agent`);
    }

    // Build tool registry for this agent
    const toolRegistry = new ToolRegistry();
    for (const toolInstance of toolInstances) {
      toolRegistry.registerToolClass(toolInstance);
    }

    this.agents.set(agentClass.name, {
      name: agentClass.name,
      options: agentOptions,
      toolRegistry,
    });

    AgentRuntime.logger.log(
      `Registered agent "${agentClass.name}" with ${toolRegistry.getAllTools().length} tools`,
    );
  }

  /** Run an agent with a user message and get a complete response */
  async run(agentName: string, input: string, options?: AgentRunOptions): Promise<string> {
    const agent = this.getAgent(agentName);
    const { providerName, modelName } = this.parseModel(options?.model || agent.options.model);
    const provider = this.getProvider(providerName);
    const maxIterations = options?.maxIterations || agent.options.maxIterations || 10;

    // Build initial messages
    const messages: ChatMessage[] = [];

    // System prompt
    const systemPrompt = [agent.options.systemPrompt, options?.systemPrompt]
      .filter(Boolean)
      .join('\n\n');
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }

    // Previous history
    if (options?.history) {
      messages.push(...options.history);
    }

    // User input
    messages.push({ role: 'user', content: input });

    // Build tool definitions — merge agent-specific tools + global plugin tools
    const effectiveRegistry = this.buildEffectiveRegistry(agent.toolRegistry);
    const tools = effectiveRegistry.buildToolDefinitions();
    const hasTools = tools.length > 0;

    // Agentic loop
    for (let iteration = 0; iteration < maxIterations; iteration++) {
      const response = await provider.generate(modelName, messages, {
        tools: hasTools ? tools : undefined,
        temperature: options?.temperature,
        maxTokens: options?.maxTokens,
      });

      // If no tool calls, return the content
      if (response.toolCalls.length === 0 || response.finishReason !== 'tool_calls') {
        return response.content || '';
      }

      // Add assistant message with tool calls
      messages.push({
        role: 'assistant',
        content: response.content || '',
        tool_calls: response.toolCalls,
      });

      // Execute each tool call
      for (const toolCall of response.toolCalls) {
        const result = await this.executeToolCall(agent, toolCall, effectiveRegistry);
        messages.push({
          role: 'tool',
          content: typeof result === 'string' ? result : JSON.stringify(result),
          tool_call_id: toolCall.id,
        });
      }

      AgentRuntime.logger.log(
        `Agent "${agentName}" iteration ${iteration + 1}: ${response.toolCalls.length} tool calls`,
      );
    }

    // Max iterations reached — get final response without tools
    const finalResponse = await provider.generate(modelName, messages, {
      temperature: options?.temperature,
      maxTokens: options?.maxTokens,
    });

    return finalResponse.content || '';
  }

  /** Stream an agent response */
  async *stream(
    agentName: string,
    input: string,
    options?: AgentRunOptions,
  ): AsyncGenerator<StreamChunk> {
    const agent = this.getAgent(agentName);
    const { providerName, modelName } = this.parseModel(options?.model || agent.options.model);
    const provider = this.getProvider(providerName);
    const maxIterations = options?.maxIterations || agent.options.maxIterations || 10;

    const messages: ChatMessage[] = [];

    const systemPrompt = [agent.options.systemPrompt, options?.systemPrompt]
      .filter(Boolean)
      .join('\n\n');
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }

    if (options?.history) {
      messages.push(...options.history);
    }

    messages.push({ role: 'user', content: input });

    const effectiveRegistryStream = this.buildEffectiveRegistry(agent.toolRegistry);
    const tools = effectiveRegistryStream.buildToolDefinitions();
    const hasTools = tools.length > 0;

    for (let iteration = 0; iteration < maxIterations; iteration++) {
      // Collect streaming response
      let content = '';
      const toolCalls: ToolCall[] = [];
      const partialToolCalls = new Map<number, { id: string; name: string; args: string }>();

      for await (const chunk of provider.stream(modelName, messages, {
        tools: hasTools ? tools : undefined,
        temperature: options?.temperature,
        maxTokens: options?.maxTokens,
      })) {
        if (chunk.type === 'text') {
          content += chunk.content || '';
          yield chunk;
        } else if (chunk.type === 'tool_call_start' && chunk.toolCall) {
          const idx = partialToolCalls.size;
          partialToolCalls.set(idx, {
            id: chunk.toolCall.id || crypto.randomUUID(),
            name: chunk.toolCall.function?.name || '',
            args: '',
          });
        } else if (chunk.type === 'tool_call_delta' && chunk.toolCall) {
          const lastIdx = partialToolCalls.size - 1;
          const partial = partialToolCalls.get(lastIdx);
          if (partial) {
            partial.args += chunk.toolCall.function?.arguments || '';
          }
        } else if (chunk.type === 'done') {
          // Assemble tool calls
          for (const [, partial] of partialToolCalls) {
            toolCalls.push({
              id: partial.id,
              type: 'function',
              function: { name: partial.name, arguments: partial.args },
            });
          }
          break;
        } else if (chunk.type === 'error') {
          yield chunk;
          return;
        }
      }

      // If no tool calls, we're done
      if (toolCalls.length === 0) {
        yield { type: 'done' };
        return;
      }

      // Execute tool calls and continue
      messages.push({
        role: 'assistant',
        content: content || '',
        tool_calls: toolCalls,
      });

      for (const toolCall of toolCalls) {
        const result = await this.executeToolCall(agent, toolCall, effectiveRegistryStream);
        messages.push({
          role: 'tool',
          content: typeof result === 'string' ? result : JSON.stringify(result),
          tool_call_id: toolCall.id,
        });
      }
    }

    yield { type: 'done' };
  }

  // ─── Private Methods ────────────────────────────────────────────

  private getAgent(name: string): AgentEntry {
    const agent = this.agents.get(name);
    if (!agent) {
      throw new Error(`Agent "${name}" not found. Available: ${Array.from(this.agents.keys()).join(', ')}`);
    }
    return agent;
  }

  private getProvider(name: string): LLMProvider {
    const provider = this.providers.get(name);
    if (!provider) {
      throw new Error(
        `LLM provider "${name}" not registered. Available: ${Array.from(this.providers.keys()).join(', ')}`,
      );
    }
    return provider;
  }

  /** Parse "provider:model" format into { providerName, modelName } */
  private parseModel(model: string): { providerName: string; modelName: string } {
    const colonIndex = model.indexOf(':');
    if (colonIndex === -1) {
      throw new Error(
        `Invalid model format "${model}". Expected "provider:model" (e.g. "openai:gpt-4o")`,
      );
    }
    return {
      providerName: model.slice(0, colonIndex),
      modelName: model.slice(colonIndex + 1),
    };
  }

  private async executeToolCall(
    agent: AgentEntry,
    toolCall: ToolCall,
    effectiveRegistry?: ToolRegistry,
  ): Promise<unknown> {
    const toolName = toolCall.function.name;
    const registry = effectiveRegistry ?? agent.toolRegistry;
    try {
      const args = JSON.parse(toolCall.function.arguments) as Record<string, unknown>;
      AgentRuntime.logger.log(`Executing tool "${toolName}" with args: ${JSON.stringify(args)}`);
      const result = await registry.executeTool(toolName, args);
      return result;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      AgentRuntime.logger.error(`Tool "${toolName}" failed: ${message}`);
      return { error: message };
    }
  }

  /**
   * Build an effective ToolRegistry that merges agent-specific tools with global plugin tools.
   * Plugin tools are available to every agent.
   */
  private buildEffectiveRegistry(agentRegistry: ToolRegistry): ToolRegistry {
    const globalTools = this.globalRegistry.getAllTools();
    if (globalTools.length === 0) return agentRegistry;

    // Create merged registry: agent tools take precedence over plugin tools
    const merged = new ToolRegistry();
    // Register global (plugin) tools first
    for (const tool of globalTools) {
      merged.registerTool(tool);
    }
    // Agent-specific tools override plugins with same name
    for (const tool of agentRegistry.getAllTools()) {
      merged.registerTool(tool);
    }
    return merged;
  }
}
