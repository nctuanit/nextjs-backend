import { expect, test, describe, beforeEach } from 'bun:test';
import { globalContainer } from '../../di/container';
import { SessionModule, SESSION_STORE } from '../session.module';
import { SessionService } from '../session.service';
import { InMemorySessionStore, SessionStore } from '../session.store';

describe('SessionModule & SessionService', () => {
  beforeEach(() => {
    globalContainer.clear();
  });
  test('should bind InMemorySessionStore by default', async () => {
    const moduleDef = SessionModule.register({ ttl: 60 });
    
    // Manually register to isolated test container flow
    globalContainer.addProviders(moduleDef.providers || []);
    
    const service = await globalContainer.resolve(SessionService);
    expect(service).toBeDefined();

    const storeInstance = await globalContainer.resolve(SESSION_STORE);
    expect(storeInstance instanceof InMemorySessionStore).toBe(true);

    const sessionId = await service.createSession({ user: 'alice' });
    expect(typeof sessionId).toBe('string');
    
    const sessionData = await service.getSession(sessionId);
    expect(sessionData?.user).toBe('alice');
    
    await service.destroySession(sessionId);
    const deletedSession = await service.getSession(sessionId);
    expect(deletedSession).toBeNull();
  });

  test('should allow custom SessionStore class injection', async () => {
    class CustomRedisStore extends SessionStore {
      private memory: Record<string, any> = {};
      async get(id: string) { return this.memory[id]; }
      async set(id: string, data: any) { this.memory[id] = data; }
      async destroy(id: string) { delete this.memory[id]; }
      async touch(id: string, ttl: number) { /* mock touch */ }
    }

    const moduleDef = SessionModule.register({ store: CustomRedisStore });
    globalContainer.addProviders(moduleDef.providers || []);
    
    const storeInstance = await globalContainer.resolve(SESSION_STORE);
    expect(storeInstance instanceof CustomRedisStore).toBe(true);

    const service = await globalContainer.resolve(SessionService);
    
    const sid = await service.createSession({ role: 'admin' });
    const data = await service.getSession(sid);
    expect(data?.role).toBe('admin');
  });
});
