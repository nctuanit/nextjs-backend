import { describe, it, expect } from 'bun:test';
import { ElysiaFactory } from '../../factory/elysia-factory';
import { Controller } from '../../decorators/controller.decorator';
import { Get } from '../../decorators/method.decorator';
import { RateLimit } from '../../decorators/rate-limit.decorator';
import { PluginsModule } from '../plugins.module';
import { Module } from '../../decorators/module.decorator';

describe('Plugins & RateLimit Module', () => {
  @Controller('/plugin-test')
  class TestController {
    @Get('/normal')
    getNormal() {
      return 'OK';
    }

    @Get('/limited')
    @RateLimit({ max: 2, duration: 1 }) // very strict rate limit for testing
    getLimited() {
      return 'LIMITED';
    }
  }

  @Module({
    imports: [
      PluginsModule.register({ cors: true, helmet: true }) // enable cors and helmet globally
    ],
    controllers: [TestController]
  })
  class TestAppModule {}

  it('should initialize app with global CORS headers attached', async () => {
    const app = await ElysiaFactory.create(TestAppModule);
    
    // Test base CORS headers via OPTIONS request
    const response = await app.handle(new Request('http://localhost/plugin-test/normal', {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://example.com' // Using https for standard cors tests
      }
    }));
    
    expect(response.status).toBe(204);
    // elysia-cors mirrors the origin if no specific origins are defined
    expect(response.headers.get('access-control-allow-origin')).toBe('https://example.com');
  });

  it('should attach Helmet security headers to standard requests', async () => {
    const app = await ElysiaFactory.create(TestAppModule);
    
    const response = await app.handle(new Request('http://localhost/plugin-test/normal'));
    
    expect(response.status).toBe(200);
    // basic helmet assertions
    expect(response.headers.get('x-dns-prefetch-control')).toBe('off');
    expect(response.headers.get('x-frame-options')).toBe('SAMEORIGIN');
    expect(response.headers.get('x-content-type-options')).toBe('nosniff');
  });

  it('should enforce @RateLimit decorator boundaries', async () => {
    const app = await ElysiaFactory.create(TestAppModule);
    
    // Pass standard IP headers so rate-limit recognizes uniqueness
    const makeRequest = () => app.handle(new Request('http://localhost/plugin-test/limited', {
      headers: { 'x-forwarded-for': '127.0.0.1' }
    }));

    // Allowed requests (limit is 2)
    const res1 = await makeRequest();
    const res2 = await makeRequest();
    
    expect(res1.status).toBe(200);
    expect(res2.status).toBe(200);

    // Rate limited request (3rd)
    const res3 = await makeRequest();
    expect(res3.status).toBe(429); // Too Many Requests
    
    // elysia-rate-limit outputs `ratelimit-*` headers natively
    expect(res3.headers.get('ratelimit-remaining')).toBe('0');
  });

  it('should not rate limit routes without @RateLimit decorator', async () => {
    const app = await ElysiaFactory.create(TestAppModule);
    
    const makeRequest = () => app.handle(new Request('http://localhost/plugin-test/normal'));

    // Fire 5 rapid requests, all should pass 200 OK since no rate limit applies
    for (let i = 0; i < 5; i++) {
        const res = await makeRequest();
        expect(res.status).toBe(200);
        // There shouldn't be rate limit headers attached natively if not wrapped via the specific route builder generator
        expect(res.headers.has('ratelimit-remaining')).toBeFalse();
    }
  });
});
