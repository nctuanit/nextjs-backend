import type { ToolRegistry } from '../tool.registry';

// ─── AI Plugin Interface ──────────────────────────────────────────

/**
 * AI Plugin — extend the AI module with additional tools.
 * Implement this interface to create reusable, distributable capability packs.
 *
 * @example
 * ```ts
 * AiModule.register({
 *   providers: [...],
 *   plugins: [new SearchPlugin({ apiKey: process.env.TAVILY_API_KEY! })],
 * })
 * ```
 */
export interface AIPlugin {
  /** Plugin identifier */
  readonly name: string;
  /** Register tools into the global tool registry */
  register(registry: ToolRegistry): void | Promise<void>;
}
