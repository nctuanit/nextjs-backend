import { describe, test, expect } from 'bun:test';
import 'reflect-metadata';

import { Controller, Get, Module } from '../../index';
import { UseGuards } from '../../src/decorators/guard.decorator';
import { Req } from '../../src/decorators/param.decorator';
import { ElysiaFactory } from '../../src/factory/elysia-factory';
import { NextAuthModule, NextAuthService, NextAuthGuard } from '../../src/auth/nextauth';
import { TestRequestBuilder } from '../../src/testing/request-builder';


// Test: NextAuthModule can be imported via forRoot
describe('NextAuthModule', () => {
  test('should register NextAuthService via forRoot()', async () => {
    @Controller('/test')
    class TestController {
      @Get('/')
      hello() {
        return { message: 'public' };
      }
    }

    @Module({
      imports: [
        NextAuthModule.forRoot({
          providers: [],
          secret: 'test-secret-key-that-is-long-enough',
          trustHost: true,
        }),
      ],
      controllers: [TestController],
    })
    class TestModule {}

    const app = await ElysiaFactory.create(TestModule);

    // Public endpoint should work
    const response = await app.handle(new TestRequestBuilder().path('/test').build());
    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data.message).toBe('public');
  });

  test('should deny access when NextAuthGuard is used without session', async () => {
    @Controller('/protected')
    class ProtectedController {
      @UseGuards(NextAuthGuard)
      @Get('/')
      secret() {
        return { secret: 'data' };
      }
    }

    @Module({
      imports: [
        NextAuthModule.forRoot({
          providers: [],
          secret: 'test-secret-key-that-is-long-enough',
          trustHost: true,
        }),
      ],
      controllers: [ProtectedController],
    })
    class ProtectedModule {}

    const app = await ElysiaFactory.create(ProtectedModule);

    const response = await app.handle(new TestRequestBuilder().path('/protected').build());
    // Should return 401 because there's no auth session
    expect(response.status).toBe(401);
    
    const text = await response.text();
    expect(text).toContain('Not authenticated');
  });
});
