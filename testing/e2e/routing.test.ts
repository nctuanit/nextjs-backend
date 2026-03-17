import { describe, expect, it, beforeAll } from 'bun:test';
import { Controller, Get, Post, Body, Param, Query, Headers, ElysiaFactory } from '../../index';
import { Module } from '../../index';
import { TestRequestBuilder } from '../../src/testing/request-builder';


@Controller('/routing')
class RoutingController {
  @Get()
  getRoot() {
    return { status: 'ok' };
  }

  @Get('/hello')
  getHello(@Query('name') name: string) {
    return { name };
  }

  @Get('/users/:id')
  getUser(@Param('id') id: string) {
    return { id };
  }

  @Post('/users')
  createUser(@Body() body: any) {
    return { created: body };
  }

  @Get('/headers')
  getHeaders(@Headers('x-req-id') reqId: string) {
    return { reqId };
  }
}

@Module({
  controllers: [RoutingController],
  providers: []
})
class RoutingModule {}

describe('E2E Routing & Parameters extraction', () => {
  let app: Awaited<ReturnType<typeof ElysiaFactory.create>>; 
  
  beforeAll(async () => {
    app = await ElysiaFactory.create(RoutingModule);
  });
  
  const req = (path: string, options?: any) => {
    const builder = new TestRequestBuilder().path(path);
    if (options?.method) builder.method(options.method);
    if (options?.headers) builder.headers(options.headers);
    if (options?.body) builder.body(options.body);
    return app.handle(builder.build());
  };

  it('should handle standard @Get', async () => {
    const res = await req('/routing');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: 'ok' });
  });

  it('should extract @Query parameters', async () => {
    const res = await req('/routing/hello?name=Tuan');
    expect(await res.json()).toEqual({ name: 'Tuan' });
  });

  it('should extract @Param', async () => {
    const res = await req('/routing/users/123');
    expect(await res.json()).toEqual({ id: '123' });
  });

  it('should extract @Body payload', async () => {
    const res = await req('/routing/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'admin' })
    });
    expect(await res.json()).toEqual({ created: { role: 'admin' } });
  });

  it('should extract @Headers (case-insensitive)', async () => {
    const res = await req('/routing/headers', {
      headers: { 'X-Req-Id': 'abc-123' }
    });
    expect(await res.json()).toEqual({ reqId: 'abc-123' });
  });
});
