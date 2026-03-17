import 'reflect-metadata';
import { describe, it, expect, beforeAll } from 'bun:test';
import { Test, TestRequestBuilder } from 'next-js-backend';
import { AppModule } from '../13-ai/backend/app.module';

describe('13-ai', () => {
  let app: Awaited<ReturnType<ReturnType<typeof Test.createTestingModule>['createApp']>>;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = await moduleRef.createApp();
  });

  describe('POST /api/ai/chat', () => {
    it('returns a mocked response based on input', async () => {
      const res = await app.handle(new TestRequestBuilder().path('/ai/chat').method('POST').headers({ 'Content-Type': 'application/json' }).body({ message: 'Hello AI', sessionId: 'test-session' }).build());
      expect(res.status).toBe(200);
      const json = await res.json() as { response: string; sessionId: string; messageCount: number };
      expect(json.response).toContain('Hello! I am a mock AI assistant');
      expect(json.sessionId).toBe('test-session');
      expect(json.messageCount).toBe(2);
    });

    it('returns a fallback message for unknown terms', async () => {
      const res = await app.handle(new TestRequestBuilder().path('/ai/chat').method('POST').headers({ 'Content-Type': 'application/json' }).body({ message: 'What is the matrix?', sessionId: 'test-session-2' }).build());
      expect(res.status).toBe(200);
      const json = await res.json() as { response: string; sessionId: string };
      expect(json.response).toContain('I received: "What is the matrix?"');
    });
  });

  describe('GET /api/ai/history', () => {
    it('returns all tracked conversations', async () => {
      const res = await app.handle(new TestRequestBuilder().path('/ai/history').build());
      expect(res.status).toBe(200);
      const json = await res.json() as Record<string, any[]>;
      expect(json['test-session']).toBeDefined();
      expect(json['test-session-2']).toBeDefined();
    });
  });

  describe('POST /api/ai/structured', () => {
    it('returns structured object when matching "product"', async () => {
      const res = await app.handle(new TestRequestBuilder().path('/ai/structured').method('POST').headers({ 'Content-Type': 'application/json' }).body({ query: 'tell me about the product' }).build());
      expect(res.status).toBe(200);
      const json = await res.json() as { result: any; schema: string };
      expect(json.result.name).toBe('Widget Pro');
      expect(json.result.price).toBe(99.99);
    });

    it('returns instructions when no match', async () => {
      const res = await app.handle(new TestRequestBuilder().path('/ai/structured').method('POST').headers({ 'Content-Type': 'application/json' }).body({ query: 'how are you?' }).build());
      expect(res.status).toBe(200);
      const json = await res.json() as { result: any };
      expect(json.result.message).toContain('Try "product"');
    });
  });

  describe('GET /api/ai/sessions', () => {
    it('returns a list of active sessions', async () => {
      const res = await app.handle(new TestRequestBuilder().path('/ai/sessions').build());
      expect(res.status).toBe(200);
      const json = await res.json() as { sessions: any[]; total: number };
      expect(json.total).toBeGreaterThanOrEqual(2);
      expect(json.sessions.some(s => s.id === 'test-session')).toBe(true);
    });
  });
});
