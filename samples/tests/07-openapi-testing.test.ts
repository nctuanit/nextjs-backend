import 'reflect-metadata';
import { describe, it, expect, beforeAll } from 'bun:test';
import { Test, TestRequestBuilder } from 'next-js-backend';
import { ProductsController } from '../07-openapi-testing/backend/products/products.controller';
import { ProductsService } from '../07-openapi-testing/backend/products/products.service';

describe('07-openapi-testing', () => {
  let app: Awaited<ReturnType<ReturnType<typeof Test.createTestingModule>['createApp']>>;
  let service: ProductsService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [ProductsService],
    }).compile();
    service = await moduleRef.get(ProductsService);
    app = await moduleRef.createApp();
  });

  // ── ProductsService unit tests ────────────────────────
  describe('ProductsService', () => {
    it('findAll returns initial seed products', () => {
      const products = service.findAll();
      expect(products.length).toBeGreaterThanOrEqual(2);
    });

    it('creates a product and finds it', () => {
      const p = service.create({ name: 'Test Widget', price: 19.99, category: 'test' });
      expect(p.id).toBeDefined();
      const found = service.findOne(p.id);
      expect(found.name).toBe('Test Widget');
    });

    it('filters by category', () => {
      service.create({ name: 'Gadget X', price: 99, category: 'gadgets' });
      const gadgets = service.findAll('gadgets');
      expect(gadgets.every(p => p.category === 'gadgets')).toBe(true);
    });

    it('throws NotFoundException for missing product', () => {
      expect(() => service.findOne('no-such-id')).toThrow('not found');
    });
  });

  // ── HTTP integration tests ────────────────────────────
  describe('GET /products', () => {
    it('returns 200 with product list', async () => {
      const res = await app.handle(new TestRequestBuilder().path('/products').build());
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(Array.isArray(body)).toBe(true);
    });

    it('filters by ?category=gadgets', async () => {
      const res = await app.handle(new TestRequestBuilder().path('/products?category=gadgets').build());
      expect(res.status).toBe(200);
      const body = await res.json() as { category: string }[];
      expect(body.every(p => p.category === 'gadgets')).toBe(true);
    });
  });

  describe('POST /products (TypeBox validation)', () => {
    it('creates a product with valid payload', async () => {
      const res = await app.handle(new TestRequestBuilder().path('/products').method('POST').headers({ 'Content-Type': 'application/json' }).body({ name: 'New Product', price: 29.99, category: 'widgets' }).build());
      expect(res.status).toBe(200);
      const body = await res.json() as { id: string; name: string; category: string };
      expect(body.id).toBeDefined();
      expect(body.name).toBe('New Product');
    });

    it('rejects invalid payload — name too short', async () => {
      const res = await app.handle(new TestRequestBuilder().path('/products').method('POST').headers({ 'Content-Type': 'application/json' }).body({ name: 'X', price: 10, category: 'test' }).build());
      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('rejects invalid payload — negative price', async () => {
      const res = await app.handle(new TestRequestBuilder().path('/products').method('POST').headers({ 'Content-Type': 'application/json' }).body({ name: 'Negative Price', price: -5, category: 'test' }).build());
      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('GET /products/:id', () => {
    it('returns 404 for unknown product', async () => {
      const res = await app.handle(new TestRequestBuilder().path('/products/nonexistent').build());
      expect(res.status).toBe(404);
    });

    it('returns 200 for known product', async () => {
      const res = await app.handle(new TestRequestBuilder().path('/products/1').build());
      expect(res.status).toBe(200);
      const body = await res.json() as { id: string; name: string };
      expect(body.id).toBe('1');
    });
  });
});
