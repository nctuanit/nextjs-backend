import { describe, test, expect } from 'bun:test';
import 'reflect-metadata';

import { Controller, Get, Module, Injectable } from '../../index';
import { ElysiaFactory } from '../../src/factory/elysia-factory';
import { HealthModule } from '../../src/health';
import { Throttle, THROTTLE_METADATA } from '../../src/decorators/throttle.decorator';
import { UseMiddleware, USE_MIDDLEWARE_METADATA } from '../../src/decorators/use-middleware.decorator';
import { TestRequestBuilder } from '../../src/testing/request-builder';


// ─── HealthModule Tests ──────────────────────────────────────────

describe('HealthModule', () => {
  test('should expose GET /health with status and uptime', async () => {
    @Module({
      imports: [HealthModule],
    })
    class TestModule {}

    const app = await ElysiaFactory.create(TestModule);
    const response = await app.handle(new TestRequestBuilder().path('/health').build());

    expect(response.status).toBe(200);
    const data = await response.json() ;
    expect(data.status).toBe('ok');
    expect(typeof data.uptime).toBe('number');
    expect(typeof data.memory.rss).toBe('number');
    expect(data.memory.unit).toBe('MB');
    expect(data.timestamp).toBeDefined();
  });
});

// ─── @Throttle Tests ─────────────────────────────────────────────

describe('@Throttle decorator', () => {
  test('should store throttle metadata on method', () => {
    class TestController {
      @Throttle({ limit: 5, ttl: 30 })
      handler() {}
    }

    const meta = Reflect.getMetadata(THROTTLE_METADATA, TestController.prototype.handler);
    expect(meta.limit).toBe(5);
    expect(meta.ttl).toBe(30);
  });

  test('should store throttle metadata on class', () => {
    @Throttle({ limit: 20, ttl: 120 })
    class TestController {}

    const meta = Reflect.getMetadata(THROTTLE_METADATA, TestController);
    expect(meta.limit).toBe(20);
    expect(meta.ttl).toBe(120);
  });

  test('should use defaults when no options provided', () => {
    class TestController {
      @Throttle()
      handler() {}
    }

    const meta = Reflect.getMetadata(THROTTLE_METADATA, TestController.prototype.handler);
    expect(meta.limit).toBe(10);
    expect(meta.ttl).toBe(60);
  });
});

// ─── @UseMiddleware Tests ────────────────────────────────────────

describe('@UseMiddleware decorator', () => {
  test('should store middleware metadata on method', () => {
    @Injectable()
    class LogMw { use() {} }

    class TestController {
      @UseMiddleware(LogMw)
      handler() {}
    }

    const meta = Reflect.getMetadata(USE_MIDDLEWARE_METADATA, TestController.prototype.handler);
    expect(meta).toHaveLength(1);
    expect(meta[0]).toBe(LogMw);
  });

  test('should store middleware metadata on class', () => {
    @Injectable()
    class AuthMw { use() {} }

    @UseMiddleware(AuthMw)
    class TestController {}

    const meta = Reflect.getMetadata(USE_MIDDLEWARE_METADATA, TestController);
    expect(meta).toHaveLength(1);
    expect(meta[0]).toBe(AuthMw);
  });
});
