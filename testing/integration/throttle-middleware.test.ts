/**
 * @Throttle & @UseMiddleware Integration Tests
 *
 * Tests actual HTTP-level behavior of throttle enforcement
 * and middleware execution order in ElysiaFactory.
 */
import { describe, test, expect } from 'bun:test';
import 'reflect-metadata';

import { Controller, Get, Module, Injectable } from '../../index';
import { ElysiaFactory } from '../../src/factory/elysia-factory';
import { Throttle } from '../../src/decorators/throttle.decorator';
import { UseMiddleware } from '../../src/decorators/use-middleware.decorator';

// ═══════════════════════════════════════════════════════════════════
// @Throttle Integration
// ═══════════════════════════════════════════════════════════════════

describe('@Throttle > HTTP Integration', () => {
  test('should allow requests within limit', async () => {
    @Controller('/api')
    class ApiCtrl {
      @Throttle({ limit: 3, ttl: 60 })
      @Get('/data')
      getData() { return { ok: true }; }
    }

    @Module({ controllers: [ApiCtrl] })
    class App {}

    const app = await ElysiaFactory.create(App);

    // First request should succeed
    const res1 = await app.handle(new Request('http://localhost/api/data'));
    expect(res1.status).toBe(200);
    const data = await res1.json() as any;
    expect(data.ok).toBe(true);
  });

  test('should also work with class-level throttle', async () => {
    @Throttle({ limit: 5, ttl: 60 })
    @Controller('/limited')
    class LimitedCtrl {
      @Get('/a')
      a() { return { route: 'a' }; }

      @Get('/b')
      b() { return { route: 'b' }; }
    }

    @Module({ controllers: [LimitedCtrl] })
    class App {}

    const app = await ElysiaFactory.create(App);

    const resA = await app.handle(new Request('http://localhost/limited/a'));
    expect(resA.status).toBe(200);

    const resB = await app.handle(new Request('http://localhost/limited/b'));
    expect(resB.status).toBe(200);
  });
});

// ═══════════════════════════════════════════════════════════════════
// @UseMiddleware Integration
// ═══════════════════════════════════════════════════════════════════

describe('@UseMiddleware > HTTP Integration', () => {
  test('should execute middleware before route handler', async () => {
    const executionOrder: string[] = [];

    @Injectable()
    class TrackingMiddleware {
      use() {
        executionOrder.push('middleware');
      }
    }

    @Controller('/mw')
    class MwCtrl {
      @UseMiddleware(TrackingMiddleware)
      @Get('/test')
      handler() {
        executionOrder.push('handler');
        return { ok: true };
      }
    }

    @Module({ controllers: [MwCtrl] })
    class App {}

    const app = await ElysiaFactory.create(App);
    const res = await app.handle(new Request('http://localhost/mw/test'));

    expect(res.status).toBe(200);
    expect(executionOrder[0]).toBe('middleware');
    expect(executionOrder[1]).toBe('handler');
  });

  test('should execute multiple middlewares in order', async () => {
    const order: string[] = [];

    @Injectable()
    class Mw1 { use() { order.push('mw1'); } }

    @Injectable()
    class Mw2 { use() { order.push('mw2'); } }

    @Controller('/multi')
    class MultiCtrl {
      @UseMiddleware(Mw1, Mw2)
      @Get('/test')
      handler() {
        order.push('handler');
        return { ok: true };
      }
    }

    @Module({ controllers: [MultiCtrl] })
    class App {}

    const app = await ElysiaFactory.create(App);
    await app.handle(new Request('http://localhost/multi/test'));

    expect(order).toEqual(['mw1', 'mw2', 'handler']);
  });

  test('should apply class-level middleware to all routes', async () => {
    const calls: string[] = [];

    @Injectable()
    class ClassMw { use() { calls.push('classMw'); } }

    @UseMiddleware(ClassMw)
    @Controller('/cls')
    class ClsCtrl {
      @Get('/a') a() { return 'a'; }
      @Get('/b') b() { return 'b'; }
    }

    @Module({ controllers: [ClsCtrl] })
    class App {}

    const app = await ElysiaFactory.create(App);
    await app.handle(new Request('http://localhost/cls/a'));
    await app.handle(new Request('http://localhost/cls/b'));

    expect(calls).toEqual(['classMw', 'classMw']);
  });
});
