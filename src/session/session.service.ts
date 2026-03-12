import { randomUUID } from 'crypto';
import { Injectable } from '../di/injectable.decorator';
import { SessionStore } from './session.store';
import type { SessionModuleOptions } from './session.options';
import type { SessionData } from '../globals';

@Injectable()
export class SessionService {
  constructor(
    private readonly store: SessionStore,
    private readonly options: SessionModuleOptions
  ) {}

  /**
   * Creates or writes data to a session and manages the corresponding Cookie payload.
   */
  async createSession(data: SessionData): Promise<string> {
    const sessionId = randomUUID();
    const ttl = this.options.ttl ?? 86400;

    await this.store.set(sessionId, data, ttl);
    return sessionId;
  }

  /**
   * Loads session from storage.
   */
  async getSession(sessionId: string): Promise<SessionData | null> {
    if (!sessionId) return null;
    
    // Attempt touch/refresh
    const ttl = this.options.ttl ?? 86400;
    if (this.store.touch) {
      await this.store.touch(sessionId, ttl);
    }
    
    return this.store.get(sessionId);
  }

  /**
   * Destroy the active backend session instance completely.
   */
  async destroySession(sessionId: string): Promise<void> {
    if (!sessionId) return;
    await this.store.destroy(sessionId);
  }
}
