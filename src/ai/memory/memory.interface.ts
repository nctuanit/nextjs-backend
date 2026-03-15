import type { ChatMessage } from '../provider.interface';

// ─── Memory Store Interface ───────────────────────────────────────

/**
 * Pluggable memory store for AI agent conversation history.
 * Implement this interface to add custom persistence (Redis, Postgres, etc.)
 */
export interface MemoryStore {
  /**
   * Save all messages for a session (overwrites previous).
   */
  save(sessionId: string, messages: ChatMessage[]): Promise<void>;

  /**
   * Load conversation history for a session.
   * Returns empty array if session not found.
   */
  load(sessionId: string): Promise<ChatMessage[]>;

  /**
   * Append a single message to an existing session.
   * More efficient than load→push→save when adding one message at a time.
   */
  append(sessionId: string, message: ChatMessage): Promise<void>;

  /**
   * Clear all messages for a session.
   */
  clear(sessionId: string): Promise<void>;

  /**
   * (Optional) Semantic search over stored messages.
   * Used by vector memory to find relevant context.
   */
  search?(query: string, sessionId: string, topK?: number): Promise<ChatMessage[]>;
}

// ─── Memory Store Token ─────────────────────────────────────────

export const MEMORY_STORE_TOKEN = 'AI_MEMORY_STORE';
