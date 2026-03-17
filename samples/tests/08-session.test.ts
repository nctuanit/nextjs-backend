import 'reflect-metadata';
import { describe, it, expect, beforeAll } from 'bun:test';
import { Test, TestRequestBuilder } from 'next-js-backend';
import { AppModule } from '../08-session/backend/app.module';

describe('08-session', () => {
  let app: Awaited<ReturnType<ReturnType<typeof Test.createTestingModule>['createApp']>>;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = await moduleRef.createApp();
  });

  let createdSessionId: string;

  describe('POST /api/session/create', () => {
    it('creates a new session and returns sessionId', async () => {
      const res = await app.handle(new TestRequestBuilder().path('/session/create').method('POST').headers({ 'Content-Type': 'application/json' }).body({ userId: 'u123', name: 'Alice', role: 'admin' }).build());
      expect(res.status).toBe(200);
      const body = await res.json() as { sessionId: string; message: string };
      expect(body.sessionId).toBeDefined();
      expect(body.message).toBe('Session created');
      createdSessionId = body.sessionId;
    });
  });

  describe('GET /api/session/read', () => {
    it('returns error if ?id is missing', async () => {
      const res = await app.handle(new TestRequestBuilder().path('/session/read').build());
      expect(res.status).toBe(200);
      const body = await res.json() as { error: string };
      expect(body.error).toBe('Missing ?id= param');
    });

    it('returns error if session not found', async () => {
      const res = await app.handle(new TestRequestBuilder().path('/session/read?id=invalid-id').build());
      expect(res.status).toBe(200);
      const body = await res.json() as { error: string; sessionId: string };
      expect(body.error).toBe('Session not found or expired');
      expect(body.sessionId).toBe('invalid-id');
    });

    it('reads the created session data correctly', async () => {
      const res = await app.handle(new TestRequestBuilder().path(`/session/read?id=${createdSessionId}`).build());
      expect(res.status).toBe(200);
      const body = await res.json() as { sessionId: string; data: any };
      expect(body.sessionId).toBe(createdSessionId);
      expect(body.data.userId).toBe('u123');
      expect(body.data.name).toBe('Alice');
      expect(body.data.role).toBe('admin');
      expect(body.data.createdAt).toBeDefined();
    });
  });

  describe('DELETE /api/session/destroy', () => {
    it('destroys an existing session', async () => {
      const res = await app.handle(new TestRequestBuilder().path('/session/destroy').method('DELETE').headers({ 'Content-Type': 'application/json' }).body({ sessionId: createdSessionId }).build());
      expect(res.status).toBe(200);
      const body = await res.json() as { destroyed: boolean; sessionId: string };
      expect(body.destroyed).toBe(true);
      expect(body.sessionId).toBe(createdSessionId);
    });

    it('verifies session is no longer readable', async () => {
      const res = await app.handle(new TestRequestBuilder().path('/session/read?id=${createdSessionId}').build());
      expect(res.status).toBe(200);
      const body = await res.json() as { error: string };
      expect(body.error).toBe('Session not found or expired');
    });
  });
});
