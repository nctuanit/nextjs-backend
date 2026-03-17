import 'reflect-metadata';
import { describe, it, expect, beforeAll } from 'bun:test';
import { Test, TestRequestBuilder } from 'next-js-backend';
import { AppModule } from '../12-dev-mode/backend/app.module';

describe('12-dev-mode', () => {
  let app: Awaited<ReturnType<ReturnType<typeof Test.createTestingModule>['createApp']>>;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = await moduleRef.createApp();
  });

  describe('GET /api/demo/hello', () => {
    it('returns hello message', async () => {
      const res = await app.handle(new TestRequestBuilder().path('/demo/hello').build());
      expect(res.status).toBe(200);
      const json = await res.json() as { message: string; requestCount: number };
      expect(json.message).toContain('Hello at');
      expect(json.requestCount).toBeGreaterThan(0);
    });
  });

  describe('GET /api/demo/error', () => {
    it('throws error and returns 500', async () => {
      const res = await app.handle(new TestRequestBuilder().path('/demo/error').build());
      expect(res.status).toBe(500);
      // Wait a moment for any dev-mode background logging
      await new Promise(r => setTimeout(r, 50));
    });
  });

  describe('POST /api/demo/echo', () => {
    it('echoes the request body', async () => {
      const payload = { test: true, value: 123 };
      const res = await app.handle(new TestRequestBuilder().path('/demo/echo').method('POST').headers({ 'Content-Type': 'application/json' }).body(payload).build());
      expect(res.status).toBe(200);
      const json = await res.json() as { echo: any; receivedAt: string };
      expect(json.echo.test).toBe(true);
      expect(json.echo.value).toBe(123);
      expect(json.receivedAt).toBeDefined();
    });
  });

  describe('GET /api/demo/log', () => {
    it('returns the log of events', async () => {
      const res = await app.handle(new TestRequestBuilder().path('/demo/log').build());
      expect(res.status).toBe(200);
      const json = await res.json() as { entries: string[]; count: number };
      expect(Array.isArray(json.entries)).toBe(true);
      expect(typeof json.count).toBe('number');
    });
  });
});
