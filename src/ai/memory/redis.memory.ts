import type { MemoryStore } from './memory.interface';
import type { ChatMessage } from '../provider.interface';

export interface RedisMemoryStoreOptions {
  /** Redis client — pass any ioredis/redis compatible client */
  client: RedisClient;
  /** Key prefix for all session keys (default: "ai:memory:") */
  keyPrefix?: string;
  /** TTL in seconds for each session (default: 86400 = 24h, 0 = no expiry) */
  ttl?: number;
  /** Maximum messages to keep per session (oldest are trimmed, default: 1000) */
  maxMessages?: number;
}

/** Minimal Redis client interface — compatible with ioredis, @upstash/redis, node-redis */
export interface RedisClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ...args: unknown[]): Promise<unknown>;
  del(key: string): Promise<unknown>;
}

/**
 * Redis-backed session store for conversation history.
 * Compatible with any Redis client that implements `get`, `set`, `del`.
 *
 * @example
 * ```ts
 * import Redis from 'ioredis';
 * const store = new RedisMemoryStore({ client: new Redis(), ttl: 3600 });
 * ```
 */
export class RedisMemoryStore implements MemoryStore {
  private readonly keyPrefix: string;
  private readonly ttl: number;
  private readonly maxMessages: number;
  private readonly client: RedisClient;

  constructor(options: RedisMemoryStoreOptions) {
    this.client = options.client;
    this.keyPrefix = options.keyPrefix ?? 'ai:memory:';
    this.ttl = options.ttl ?? 86400;
    this.maxMessages = options.maxMessages ?? 1000;
  }

  private key(sessionId: string): string {
    return `${this.keyPrefix}${sessionId}`;
  }

  async save(sessionId: string, messages: ChatMessage[]): Promise<void> {
    const trimmed = messages.slice(-this.maxMessages);
    const serialized = JSON.stringify(trimmed);
    if (this.ttl > 0) {
      await this.client.set(this.key(sessionId), serialized, 'EX', this.ttl);
    } else {
      await this.client.set(this.key(sessionId), serialized);
    }
  }

  async load(sessionId: string): Promise<ChatMessage[]> {
    const data = await this.client.get(this.key(sessionId));
    if (!data) return [];
    try {
      return JSON.parse(data) as ChatMessage[];
    } catch {
      return [];
    }
  }

  async append(sessionId: string, message: ChatMessage): Promise<void> {
    const existing = await this.load(sessionId);
    existing.push(message);
    await this.save(sessionId, existing);
  }

  async clear(sessionId: string): Promise<void> {
    await this.client.del(this.key(sessionId));
  }
}
