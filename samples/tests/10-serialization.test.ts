import 'reflect-metadata';
import { describe, it, expect, beforeAll } from 'bun:test';
import { Test, TestRequestBuilder } from 'next-js-backend';
import { AppModule } from '../10-serialization/backend/app.module';

describe('10-serialization', () => {
  let app: Awaited<ReturnType<ReturnType<typeof Test.createTestingModule>['createApp']>>;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = await moduleRef.createApp();
  });

  describe('GET /api/users/raw', () => {
    it('returns all raw database fields including password', async () => {
      const res = await app.handle(new TestRequestBuilder().path('/users/raw').build());
      expect(res.status).toBe(200);
      const json = await res.json() as any[];
      expect(json.length).toBeGreaterThan(0);
      expect(json[0].password).toBeDefined();
      expect(json[0].internalNotes).toBeDefined();
    });
  });

  describe('GET /api/users/safe', () => {
    it('returns serialized data excluding password and internalNotes', async () => {
      const res = await app.handle(new TestRequestBuilder().path('/users/safe').build());
      expect(res.status).toBe(200);
      const json = await res.json() as any[];
      expect(json.length).toBeGreaterThan(0);
      expect(json[0].password).toBeUndefined();
      expect(json[0].internalNotes).toBeUndefined();
    });

    it('transforms the role and createdAt fields', async () => {
      const res = await app.handle(new TestRequestBuilder().path('/users/safe').build());
      const json = await res.json() as any[];
      const alice = json.find((u: any) => u.name === 'Alice');
      expect(alice.role).toBe('ADMIN'); // uppercase transform
      expect(alice.createdAt).toMatch(/\d{2}\/\d{2}\/\d{4}/); // toLocaleDateString transform
    });
  });

  describe('GET /api/users/:id/raw', () => {
    it('returns a single raw user', async () => {
      const res = await app.handle(new TestRequestBuilder().path('/users/1/raw').build());
      expect(res.status).toBe(200);
      const user = await res.json() as any;
      expect(user.id).toBe('1');
      expect(user.password).toBe('secret123');
    });
  });

  describe('GET /api/users/:id/safe', () => {
    it('returns a single serialized user', async () => {
      const res = await app.handle(new TestRequestBuilder().path('/users/1/safe').build());
      expect(res.status).toBe(200);
      const user = await res.json() as any;
      expect(user.id).toBe('1');
      expect(user.password).toBeUndefined();
      expect(user.role).toBe('ADMIN');
    });

    it('returns error when user is not found', async () => {
      const res = await app.handle(new TestRequestBuilder().path('/users/999/safe').build());
      expect(res.status).toBe(404);
      const text = await res.text();
      expect(text).toBe('Not found');
    });
  });
});
