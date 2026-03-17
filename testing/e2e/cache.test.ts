import { describe, expect, it, beforeAll } from 'bun:test';
import { Controller, Get, ElysiaFactory, Module } from '../../index';
import { UseInterceptors, Injectable } from '../../index';
import { CacheModule, CacheInterceptor, CacheKey, CacheTTL, CACHE_MANAGER } from '../../index';
import { globalContainer } from '../../index';
import { TestRequestBuilder } from '../../src/testing/request-builder';


let executionCount = 0;

@Controller('/cache')
class CacheController {
  
  @Get('/default')
  @UseInterceptors(CacheInterceptor)
  getDefaultCaches() {
    executionCount++;
    return { data: 'Default cache value', id: executionCount };
  }

  @Get('/custom-key')
  @UseInterceptors(CacheInterceptor)
  @CacheKey('my_custom_key')
  getCustomKeyCaches() {
    executionCount++;
    return { data: 'Custom key cache value', id: executionCount };
  }

  @Get('/custom-ttl')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(100) // 100ms
  getCustomTtlCaches() {
    executionCount++;
    return { data: 'Custom TTL cache value', id: executionCount };
  }
}

describe('CacheModule & CacheInterceptor', () => {
  let app: Awaited<ReturnType<typeof ElysiaFactory.create>>;

  beforeAll(async () => {
    // Reset DI and counts
    globalContainer.clear();
    executionCount = 0;
    
    // Register Cache Module
    const moduleDef = CacheModule.register();
    globalContainer.addProviders(moduleDef.providers || []);
    
    @Module({
      controllers: [CacheController]
    })
    class DummyModule {}

    app = await ElysiaFactory.create(DummyModule);
  });

  const req = (path: string, options?: any) => {
    const builder = new TestRequestBuilder().path(path);
    if (options?.method) builder.method(options.method);
    if (options?.headers) builder.headers(options.headers);
    if (options?.body) builder.body(options.body);
    return app.handle(builder.build());
  };

  it('should cache response with default URL-based key', async () => {
    // 1st request - should execute and cache
    const res1 = await req('/cache/default');
    const body1 = await res1.json() ;
    expect(body1.id).toBe(1);

    // 2nd request - should hit cache
    const res2 = await req('/cache/default');
    const body2 = await res2.json() ;
    expect(body2.id).toBe(1); // The execution count shouldn't have gone up
  });

  it('should use explicitly defined CacheKey metadata', async () => {
    // 1st request 
    const res1 = await req('/cache/custom-key');
    const body1 = await res1.json() ;
    expect(body1.id).toBe(2);

    // 2nd request
    const res2 = await req('/cache/custom-key');
    const body2 = await res2.json() ;
    expect(body2.id).toBe(2); // From cache

    // Wait and verify inside the actual cache manager that the specific custom key exists
    const cacheManager = await globalContainer.resolve(CACHE_MANAGER) as any;
    const value = await cacheManager.get('my_custom_key');
    expect(value).toEqual({ data: 'Custom key cache value', id: 2 });
  });

  it('should expire cache based on explicitly defined CacheTTL metadata', async () => {
    // 1st request 
    const res1 = await req('/cache/custom-ttl');
    const body1 = await res1.json() ;
    expect(body1.id).toBe(3);

    // 2nd request - immediately after, should hit cache
    const res2 = await req('/cache/custom-ttl');
    const body2 = await res2.json() ;
    expect(body2.id).toBe(3);

    // Wait 150ms for the 100ms TTL to expire
    await new Promise((resolve) => setTimeout(resolve, 150));

    // 3rd request - should execute again because cache expired
    const res3 = await req('/cache/custom-ttl');
    const body3 = await res3.json() ;
    expect(body3.id).toBe(4);
  });
});
