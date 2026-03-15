import type { Type } from '../di/provider';
import type { AIPlugin } from './plugins/plugin.interface';
import type { MemoryStore } from './memory/memory.interface';

// ─── Chat Messages ───────────────────────────────────────────────

export type ChatRole = 'system' | 'user' | 'assistant' | 'tool';

export interface ChatMessage {
  role: ChatRole;
  content: string;
  /** Tool call ID (required when role is 'tool') */
  tool_call_id?: string;
  /** Tool calls made by the assistant */
  tool_calls?: ToolCall[];
}

// ─── Tool Definitions ────────────────────────────────────────────

export interface ToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string; // JSON string
  };
}

// ─── LLM Responses ──────────────────────────────────────────────

export interface LLMResponse {
  content: string | null;
  toolCalls: ToolCall[];
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason: 'stop' | 'tool_calls' | 'length' | 'content_filter';
}

// ─── Streaming ───────────────────────────────────────────────────

export type StreamChunkType = 'text' | 'tool_call_start' | 'tool_call_delta' | 'done' | 'error';

export interface StreamChunk {
  type: StreamChunkType;
  content?: string;
  toolCall?: Partial<ToolCall>;
  error?: string;
}

// ─── Provider Options ────────────────────────────────────────────

export interface GenerateOptions {
  tools?: ToolDefinition[];
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  stop?: string[];
}

export interface StreamOptions extends GenerateOptions {}

// ─── Provider Interface ──────────────────────────────────────────

export interface LLMProvider {
  readonly name: string;

  /** Generate a complete response */
  generate(
    model: string,
    messages: ChatMessage[],
    options?: GenerateOptions,
  ): Promise<LLMResponse>;

  /** Stream a response chunk by chunk */
  stream(
    model: string,
    messages: ChatMessage[],
    options?: StreamOptions,
  ): AsyncGenerator<StreamChunk>;
}

// ─── Provider Config ─────────────────────────────────────────────

export interface ProviderConfig {
  /** Provider identifier: "openai", "anthropic", "google" */
  provider: string;
  /** API key for the provider */
  apiKey: string;
  /** Custom base URL (for proxies or local models) */
  baseUrl?: string;
}

// ─── AI Module Config ────────────────────────────────────────────

export interface AiModuleConfig {
  /** LLM provider configurations */
  providers: ProviderConfig[];
  /** Tool classes to register */
  tools?: Type<unknown>[];
  /** Agent classes to register */
  agents?: Type<unknown>[];
  /** Default model (e.g. "openai:gpt-4o") */
  defaultModel?: string;
  /** Plugins to register (SearchPlugin, DatabasePlugin, etc.) */
  plugins?: AIPlugin[];
  /** Memory store for conversation session history */
  memory?: MemoryStore;
}
