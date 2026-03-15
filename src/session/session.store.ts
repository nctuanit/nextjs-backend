import { Injectable } from '../di/injectable.decorator';
import type { SessionData } from '../globals';

/**
 * Abstract class that robust session stores must extend.
 * Users can create custom classes (Redis, Prisma, BunORM) implementing this
 * to provide centralized state distribution.
 */
export abstract class SessionStore {
  /**
   * Retrieves a session from the store given a session ID.
   */
  abstract get(sessionId: string): Promise<SessionData | null>;

  /**
   * Upserts a session into the store given a session ID and session data.
   * 
   * @param sessionId Explicit session ID attached to the Cookie.
   * @param data The payload attached to the user.
   * @param ttl Expected Time To Live in seconds. 0 indicates non-expiring.
   */
  abstract set(sessionId: string, data: SessionData, ttl: number): Promise<void>;

  /**
   * Specifically destroys a running session by ID.
   */
  abstract destroy(sessionId: string): Promise<void>;

  /**
   * Refresh a session's Time To Live if accessed.
   */
  abstract touch?(sessionId: string, ttl: number): Promise<void>;
}

/**
 * A built-in, non-persistent In-Memory Session Storage mechanism.
 * Ideal for local development or basic deployment without a DB dependency.
 */
@Injectable()
export class InMemorySessionStore implements SessionStore {
  // Store shape: sessionId => { data, expiresAt }
  private store = new Map<string, { data: SessionData; expiresAt: number }>();
  private cleanupTimer: ReturnType<typeof setInterval>;

  constructor() {
    // Periodically purge expired sessions to prevent memory leaks
    this.cleanupTimer = setInterval(() => this.purgeExpired(), 60_000);
    // Allow process to exit without waiting for this timer
    if (this.cleanupTimer.unref) this.cleanupTimer.unref();
  }

  /** Remove all expired entries from the store */
  private purgeExpired(): void {
    const now = Date.now();
    for (const [id, entry] of this.store) {
      if (entry.expiresAt > 0 && entry.expiresAt < now) {
        this.store.delete(id);
      }
    }
  }

  async get(sessionId: string): Promise<SessionData | null> {
    const entry = this.store.get(sessionId);
    if (!entry) return null;

    // Check expiration dynamically on retrieval
    if (entry.expiresAt > 0 && entry.expiresAt < Date.now()) {
      this.store.delete(sessionId);
      return null;
    }

    return entry.data;
  }

  async set(sessionId: string, data: SessionData, ttl: number): Promise<void> {
    const expiresAt = ttl === 0 ? 0 : Date.now() + ttl * 1000;
    this.store.set(sessionId, { data, expiresAt });
  }

  async destroy(sessionId: string): Promise<void> {
    this.store.delete(sessionId);
  }

  async touch(sessionId: string, ttl: number): Promise<void> {
    const entry = this.store.get(sessionId);
    if (entry && ttl > 0) {
      entry.expiresAt = Date.now() + ttl * 1000;
      this.store.set(sessionId, entry);
    }
  }
}
