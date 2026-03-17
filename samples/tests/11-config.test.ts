import 'reflect-metadata';
import { describe, it, expect, beforeAll } from 'bun:test';
import { Test, TestRequestBuilder } from 'next-js-backend';
import { AppModule } from '../11-config/backend/app.module';

describe('11-config', () => {
  let app: Awaited<ReturnType<ReturnType<typeof Test.createTestingModule>['createApp']>>;

  beforeAll(async () => {
    // Set some environment variables for testing
    process.env.APP_NAME = 'Test App';
    process.env.APP_PORT = '9999';

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = await moduleRef.createApp();
  });

  describe('GET /api/config/all', () => {
    it('returns config values', async () => {
      const res = await app.handle(new TestRequestBuilder().path('/config/all').build());
      expect(res.status).toBe(200);
      const json = await res.json() as any;
      expect(json.appName).toBe('Test App');
      expect(json.appPort).toBe('9999');
      expect(json.nodeEnv).toBeDefined();
    });
  });

  describe('GET /api/config/env', () => {
    it('returns NODE_ENV details', async () => {
      const res = await app.handle(new TestRequestBuilder().path('/config/env').build());
      expect(res.status).toBe(200);
      const json = await res.json() as any;
      expect(json.nodeEnv).toBeDefined();
      expect(typeof json.isDev).toBe('boolean');
    });
  });

  describe('GET /api/config/get', () => {
    it('returns specific keys', async () => {
      const res = await app.handle(new TestRequestBuilder().path('/config/get').build());
      expect(res.status).toBe(200);
      const json = await res.json() as any;
      expect(json.APP_NAME).toBe('Test App');
      expect(json.APP_PORT).toBe('9999');
      expect(json.DATABASE_URL).toBeDefined();
    });
  });
});
