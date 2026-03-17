import { describe, expect, it, beforeAll } from 'bun:test';
import { Controller, Get, ElysiaFactory, Req } from '../../index';
import { Middleware, Injectable } from '../../index';
import { type NestMiddleware } from '../../src/interfaces';
import { Module } from '../../index';
import { TestRequestBuilder } from '../../src/testing/request-builder';


@Injectable()
class AuditMiddleware implements NestMiddleware {
  async use(req: Request, set: any, next: () => void | Promise<void>) {
    // Middleware can intercept the request before it reaches guards/controllers
    // Add custom header to the request to prove it was here
    req.headers.set('X-Audit-Triggered', 'true');
    await next();
  }
}

@Controller('/middleware')
class MiddlewareController {
  @Get('/test')
  getTest(@Req() req: Request) {
    // Controller should receive the augmented request
    return {
      success: true,
      audited: req.headers.get('X-Audit-Triggered') === 'true'
    };
  }
}

@Module({
  controllers: [MiddlewareController],
  providers: [AuditMiddleware]
})
class MiddlewareAppModule {}

describe('E2E Global Middleware (@Middleware, NestMiddleware)', () => {
  let app: Awaited<ReturnType<typeof ElysiaFactory.create>>;

  beforeAll(async () => {
    app = await ElysiaFactory.create(MiddlewareAppModule, {
      globalMiddlewares: [AuditMiddleware]
    });
  });

  const req = (path: string, options?: any) => {
    const builder = new TestRequestBuilder().path(path);
    if (options?.method) builder.method(options.method);
    if (options?.headers) builder.headers(options.headers);
    if (options?.body) builder.body(options.body);
    return app.handle(builder.build());
  };

  it('should execute global middleware before hitting the controller route', async () => {
    const res = await req('/middleware/test');
    expect(res.status).toBe(200);
    
    const body = await res.json() ;
    expect(body.success).toBe(true);
    expect(body.audited).toBe(true);
  });
});
