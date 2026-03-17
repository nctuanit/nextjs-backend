/**
 * Health Module Integration Tests
 * 
 * Tests the HealthModule endpoint behavior within ElysiaFactory.
 */
import { describe, test, expect } from 'bun:test';
import 'reflect-metadata';

import { Controller, Get, Module } from '../../index';
import { ElysiaFactory } from '../../src/factory/elysia-factory';
import { HealthModule } from '../../src/health';
import { HealthService } from '../../src/health/health.service';
import { TestRequestBuilder } from '../../src/testing/request-builder';


describe('HealthModule > Integration', () => {
  test('should expose GET /health with full response shape', async () => {
    @Module({ imports: [HealthModule] })
    class App {}

    const app = await ElysiaFactory.create(App);
    const res = await app.handle(new TestRequestBuilder().path('/health').build());

    expect(res.status).toBe(200);
    const data = await res.json() ;
    expect(data.status).toBe('ok');
    expect(typeof data.uptime).toBe('number');
    expect(data.uptime).toBeGreaterThanOrEqual(0);
    expect(typeof data.memory.rss).toBe('number');
    expect(typeof data.memory.heapUsed).toBe('number');
    expect(typeof data.memory.heapTotal).toBe('number');
    expect(data.memory.unit).toBe('MB');
    expect(data.timestamp).toBeDefined();
  });

  test('should work alongside other controllers', async () => {
    @Controller('/api')
    class ApiCtrl {
      @Get('/ping')
      ping() { return { pong: true }; }
    }

    @Module({
      imports: [HealthModule],
      controllers: [ApiCtrl],
    })
    class App {}

    const app = await ElysiaFactory.create(App);

    // Health endpoint works
    const healthRes = await app.handle(new TestRequestBuilder().path('/health').build());
    expect(healthRes.status).toBe(200);

    // Custom endpoint works alongside
    const apiRes = await app.handle(new TestRequestBuilder().path('/api/ping').build());
    expect(apiRes.status).toBe(200);
    const apiData = await apiRes.json() ;
    expect(apiData.pong).toBe(true);
  });

  test('HealthService.check() should return valid health data', () => {
    const service = new HealthService();
    const result = service.check();
    expect(result.status).toBe('ok');
    expect(typeof result.uptime).toBe('number');
    expect(typeof result.memory.rss).toBe('number');
  });
});
