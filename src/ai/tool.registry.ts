import 'reflect-metadata';
import { AI_TOOL_METADATA } from './ai.constants';
import type { ToolOptions } from './ai.decorators';
import type { ToolDefinition } from './provider.interface';
import { Value, type ValueError } from '@sinclair/typebox/value';
import { type TSchema } from '@sinclair/typebox';

// ─── Tool Input Validation ────────────────────────────────────────

export interface ToolValidationError {
  path: string;
  message: string;
}

export class ToolInputValidationError extends Error {
  constructor(
    public readonly toolName: string,
    public readonly errors: ToolValidationError[],
  ) {
    const detail = errors.map((e) => `  [${e.path || '/'}] ${e.message}`).join('\n');
    super(`Tool "${toolName}" received invalid input:\n${detail}`);
    this.name = 'ToolInputValidationError';
  }
}

// ─── Tool Entry ──────────────────────────────────────────────────

export interface ToolEntry {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  /** TypeBox schema for runtime input validation (optional) */
  schema?: TSchema;
  handler: (...args: unknown[]) => Promise<unknown>;
  /** The instance the handler is bound to */
  instance: object;
}

// ─── Tool Registry ───────────────────────────────────────────────

export class ToolRegistry {
  private tools = new Map<string, ToolEntry>();

  /**
   * Scan a class instance for @Tool decorated methods and register them.
   */
  registerToolClass(instance: object): void {
    const prototype = Object.getPrototypeOf(instance) as Record<string, unknown>;
    const methodNames = Object.getOwnPropertyNames(prototype).filter(
      (m) => m !== 'constructor' && typeof prototype[m] === 'function',
    );

    for (const methodName of methodNames) {
      const method = prototype[methodName] as (...args: unknown[]) => unknown;
      const toolConfig: ToolOptions | undefined = Reflect.getMetadata(AI_TOOL_METADATA, method);
      
      if (toolConfig) {
        const name = toolConfig.name || methodName;

        // Build JSON Schema from parameters config
        const schema = toolConfig.schema;
        const parameters: Record<string, unknown> = toolConfig.parameters
          || (schema ? (schema as Record<string, unknown>) : { type: 'object', properties: {} });

        this.tools.set(name, {
          name,
          description: toolConfig.description,
          parameters,
          schema,
          handler: method.bind(instance) as (...args: unknown[]) => Promise<unknown>,
          instance,
        });
      }
    }
  }

  /** Register a single tool manually */
  registerTool(entry: ToolEntry): void {
    this.tools.set(entry.name, entry);
  }

  /** Get a tool by name */
  getTool(name: string): ToolEntry | undefined {
    return this.tools.get(name);
  }

  /** Get all registered tools */
  getAllTools(): ToolEntry[] {
    return Array.from(this.tools.values());
  }

  /** Build tool definitions compatible with LLM provider APIs (OpenAI format) */
  buildToolDefinitions(): ToolDefinition[] {
    return this.getAllTools().map((tool) => ({
      type: 'function' as const,
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
      },
    }));
  }

  /**
   * Execute a tool by name with parsed arguments.
   * If the tool has a TypeBox `schema`, input is validated before execution.
   */
  async executeTool(name: string, args: Record<string, unknown>): Promise<unknown> {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`Tool "${name}" not found in registry.`);
    }

    // Validate input if a TypeBox schema is attached
    if (tool.schema) {
      const errors = Array.from(Value.Errors(tool.schema, args)) as ValueError[];
      if (errors.length > 0) {
        throw new ToolInputValidationError(
          name,
          errors.map((e) => ({ path: e.path, message: e.message })),
        );
      }
      // Clean/coerce/default the values after validation
      const cleaned = Value.Clean(tool.schema, Value.Clone(args)) as Record<string, unknown>;
      const argValues = Object.values(cleaned);
      return tool.handler(...argValues);
    }

    // No schema — pass args directly
    const argValues = Object.values(args);
    return tool.handler(...argValues);
  }

  /** Clear all tools */
  clear(): void {
    this.tools.clear();
  }
}

/** Global tool registry singleton */
export const globalToolRegistry = new ToolRegistry();
