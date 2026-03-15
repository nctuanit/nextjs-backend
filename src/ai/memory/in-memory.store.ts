import type { MemoryStore } from './memory.interface';
import type { ChatMessage } from '../provider.interface';

/**
 * In-memory session store for conversation history.
 * Suitable for development and single-instance deployments.
 *
 * ⚠️ Data is lost on process restart. Use RedisMemoryStore for production.
 */
export class InMemoryMemoryStore implements MemoryStore {
  private sessions = new Map<string, ChatMessage[]>();

  async save(sessionId: string, messages: ChatMessage[]): Promise<void> {
    this.sessions.set(sessionId, [...messages]);
  }

  async load(sessionId: string): Promise<ChatMessage[]> {
    return [...(this.sessions.get(sessionId) ?? [])];
  }

  async append(sessionId: string, message: ChatMessage): Promise<void> {
    const existing = this.sessions.get(sessionId) ?? [];
    existing.push(message);
    this.sessions.set(sessionId, existing);
  }

  async clear(sessionId: string): Promise<void> {
    this.sessions.delete(sessionId);
  }

  /** Get all active session IDs */
  sessions_(): string[] {
    return Array.from(this.sessions.keys());
  }
}
