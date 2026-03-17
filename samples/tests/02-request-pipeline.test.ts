import 'reflect-metadata';
import { describe, it, expect, beforeAll } from 'bun:test';
import { Test, BadRequestException, TestRequestBuilder } from 'next-js-backend';
import { PipelineController } from '../02-request-pipeline/backend/pipeline/pipeline.controller';
import { RolesGuard } from '../02-request-pipeline/backend/pipeline/roles.guard';
import { TimingInterceptor } from '../02-request-pipeline/backend/pipeline/timing.interceptor';
import { ParseIntPipe } from '../02-request-pipeline/backend/pipeline/parse-int.pipe';

describe('02-request-pipeline', () => {
  let app: Awaited<ReturnType<ReturnType<typeof Test.createTestingModule>['createApp']>>;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [PipelineController],
      providers: [RolesGuard, TimingInterceptor],
    }).compile();
    app = await moduleRef.createApp();
  });

  // ── ParseIntPipe unit tests ──────────────────────────
  describe('ParseIntPipe', () => {
    const pipe = new ParseIntPipe();

    it('transforms valid integer string', () => {
      const result = pipe.transform('42', { type: 'param', metatype: Number });
      expect(result).toBe(42);
    });

    it('transforms negative integer', () => {
      const result = pipe.transform('-5', { type: 'param', metatype: Number });
      expect(result).toBe(-5);
    });

    it('throws BadRequestException for non-numeric string', () => {
      expect(() => pipe.transform('abc', { type: 'param', metatype: Number })).toThrow(BadRequestException);
    });

    it('throws BadRequestException for empty string', () => {
      expect(() => pipe.transform('', { type: 'param', metatype: Number })).toThrow(BadRequestException);
    });
  });

  // ── RolesGuard unit tests ─────────────────────────────
  describe('RolesGuard', () => {
    const guard = new RolesGuard();

    it('allows request with ?role=admin', () => {
      const ctx = { request: new TestRequestBuilder().path('/admin?role=admin').build() };
      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('blocks request with ?role=user', () => {
      const ctx = { request: new TestRequestBuilder().path('/admin?role=user').build() };
      expect(guard.canActivate(ctx)).toBe(false);
    });

    it('blocks request with no role param', () => {
      const ctx = { request: new TestRequestBuilder().path('/admin').build() };
      expect(guard.canActivate(ctx)).toBe(false);
    });
  });

  // ── HTTP integration tests ────────────────────────────
  describe('GET /pipeline/public', () => {
    it('returns 200 and TimingInterceptor wraps response in {data,meta}', async () => {
      const res = await app.handle(new TestRequestBuilder().path('/pipeline/public').build());
      expect(res.status).toBe(200);
      const body = await res.json() as { data: unknown; meta: { duration: string } };
      expect(body.meta?.duration).toMatch(/\d+ms/);
      expect((body.data as { message: string }).message).toBe('Public route — no guard');
    });
  });

  describe('GET /pipeline/admin', () => {
    it('returns 403 when RolesGuard fails', async () => {
      const res = await app.handle(new TestRequestBuilder().path('/pipeline/admin?role=user').build());
      expect(res.status).toBe(403);
    });

    it('returns 200 when role=admin', async () => {
      const res = await app.handle(new TestRequestBuilder().path('/pipeline/admin?role=admin').build());
      expect(res.status).toBe(200);
    });
  });

  // ParseIntPipe applied inline — controller route is /pipeline/items/:id
  describe('GET /pipeline/items/:id', () => {
    it('returns the parsed integer id (unwrapped from TimingInterceptor)', async () => {
      const res = await app.handle(new TestRequestBuilder().path('/pipeline/items/7').build());
      expect(res.status).toBe(200);
      const body = await res.json() as { data: { id: number; label: string }; meta: { duration: string } };
      // TimingInterceptor wraps response: { data: { id, label }, meta: { duration } }
      const item = body.data ?? (body as any);
      expect(item.id ?? (body as any).id).toBe(7);
    });

    it('returns 400 for non-integer (ParseIntPipe)', async () => {
      const res = await app.handle(new TestRequestBuilder().path('/pipeline/items/xyz').build());
      expect(res.status).toBe(400);
    });
  });

  describe('GET /pipeline/bad (ParseIntPipe throws)', () => {
    it('returns 400', async () => {
      const res = await app.handle(new TestRequestBuilder().path('/pipeline/bad').build());
      expect(res.status).toBe(400);
    });
  });
});
