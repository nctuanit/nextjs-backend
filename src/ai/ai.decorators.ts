import 'reflect-metadata';
import {
  AI_TOOL_METADATA,
  AI_AGENT_METADATA,
  AI_MEMORY_METADATA,
  AI_WORKFLOW_METADATA,
  AI_STEP_METADATA,
} from './ai.constants';
import type { Type } from '../di/provider';
import type { TSchema } from '@sinclair/typebox';

// ─── Tool Decorator ──────────────────────────────────────────────

export interface ToolOptions {
  /** Tool name (defaults to method name) */
  name?: string;
  /** Description for the LLM to understand when to use this tool */
  description: string;
  /**
   * TypeBox schema for runtime input validation.
   * Recommended over `parameters` — provides both validation AND JSON Schema for the LLM.
   *
   * @example
   * ```ts
   * @Tool({ description: 'Get user by ID', schema: t.Object({ id: t.String() }) })
   * async getUser(id: string) {}
   * ```
   */
  schema?: TSchema;
  /**
   * Raw JSON Schema for parameters (used if `schema` is not provided).
   * When `schema` is set, this is auto-derived from it.
   */
  parameters?: Record<string, unknown>;
}

/**
 * Marks a method as an AI-callable tool.
 * The method will be registered in the tool registry and made available to agents.
 *
 * @example
 * ```ts
 * class UserTools {
 *   @Tool({ description: 'Get user by ID' })
 *   async getUser(id: string) {
 *     return db.user.findUnique({ where: { id } });
 *   }
 * }
 * ```
 */
export function Tool(options: ToolOptions): MethodDecorator {
  return (target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    const config: ToolOptions = {
      name: options.name || String(propertyKey),
      ...options,
    };
    Reflect.defineMetadata(AI_TOOL_METADATA, config, descriptor.value as object);
  };
}

// ─── Agent Decorator ─────────────────────────────────────────────

export interface AgentOptions {
  /** Model identifier — format: "provider:model" (e.g. "openai:gpt-4o", "anthropic:claude-3-5-sonnet") */
  model: string;
  /** Tool classes whose @Tool methods this agent can call */
  tools?: Type<unknown>[];
  /** System prompt for the agent */
  systemPrompt?: string;
  /** Memory class for conversation context */
  memory?: Type<unknown>;
  /** Max tool-call iterations before forcing a response */
  maxIterations?: number;
}

/**
 * Marks a class as an AI Agent that can orchestrate LLM interactions.
 *
 * @example
 * ```ts
 * @Agent({ model: 'openai:gpt-4o', tools: [UserTools] })
 * class SupportAgent {}
 * ```
 */
export function Agent(options: AgentOptions): ClassDecorator {
  return (target: Function) => {
    Reflect.defineMetadata(AI_AGENT_METADATA, options, target);
  };
}

// ─── Memory Decorator ────────────────────────────────────────────

export type MemoryType = 'conversation' | 'short-term' | 'vector' | 'persistent';

export interface MemoryOptions {
  /** Type of memory store */
  type: MemoryType;
  /** Max number of messages to retain (for conversation memory) */
  maxMessages?: number;
}

/**
 * Marks a class as a memory store for AI agents.
 */
export function Memory(options: MemoryOptions): ClassDecorator {
  return (target: Function) => {
    Reflect.defineMetadata(AI_MEMORY_METADATA, options, target);
  };
}

// ─── Workflow Decorator ──────────────────────────────────────────

export interface WorkflowOptions {
  /** Workflow name (defaults to class name) */
  name?: string;
  /** Description of the workflow */
  description?: string;
}

/**
 * Marks a class as a multi-step AI workflow.
 */
export function Workflow(options?: WorkflowOptions): ClassDecorator {
  return (target: Function) => {
    const config: WorkflowOptions = {
      name: options?.name || target.name,
      ...options,
    };
    Reflect.defineMetadata(AI_WORKFLOW_METADATA, config, target);
  };
}

// ─── Step Decorator ──────────────────────────────────────────────

export interface StepOptions {
  /** Execution order (lower = earlier). Steps with the SAME order run in parallel if parallel=true. */
  order?: number;
  /** Description of this step */
  description?: string;
  /** Number of retry attempts on failure (with exponential backoff) */
  retries?: number;
  /**
   * Run this step in parallel with other same-order steps.
   * All steps in the same order group must have parallel=true to enable parallel execution.
   */
  parallel?: boolean;
  /**
   * Conditional execution — step is skipped if this returns false.
   * @example `when: (ctx) => ctx.get('riskLevel') === 'high'`
   */
  when?: (ctx: import('./workflow/workflow.context').WorkflowContext) => boolean;
}

/**
 * Marks a method as a step in a workflow.
 */
export function Step(options?: StepOptions): MethodDecorator {
  return (target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    const config: StepOptions = { order: 0, retries: 0, parallel: false, ...options };
    Reflect.defineMetadata(AI_STEP_METADATA, config, descriptor.value as object);
  };
}
