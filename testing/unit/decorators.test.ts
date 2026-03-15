/**
 * Decorator Metadata Tests
 * 
 * Verifies that all decorators correctly store metadata via reflect-metadata.
 * Groups: Controller, Method, Param, Guard, Interceptor, Pipe, Filter, Throttle, Middleware
 */
import { describe, test, expect } from 'bun:test';
import 'reflect-metadata';

import { Controller } from '../../src/decorators/controller.decorator';
import { Get, Post, Put, Delete, Patch, RequestMethod } from '../../src/decorators/method.decorator';
import { UseGuards } from '../../src/decorators/guard.decorator';
import { UseInterceptors } from '../../src/decorators/interceptor.decorator';
import { UsePipes } from '../../src/decorators/pipe.decorator';
import { UseFilters } from '../../src/decorators/filter.decorator';
import { Throttle, THROTTLE_METADATA } from '../../src/decorators/throttle.decorator';
import { UseMiddleware, USE_MIDDLEWARE_METADATA } from '../../src/decorators/use-middleware.decorator';
import { RateLimit, RATE_LIMIT_METADATA } from '../../src/decorators/rate-limit.decorator';
import { Sse, SSE_METADATA } from '../../src/decorators/sse.decorator';
import { CacheKey, CacheTTL } from '../../src/decorators/cache.decorator';
import { Injectable } from '../../src/di/injectable.decorator';
import {
  CONTROLLER_WATERMARK, PATH_METADATA, METHOD_METADATA,
  GUARDS_METADATA, INTERCEPTORS_METADATA, PIPES_METADATA, FILTERS_METADATA,
} from '../../src/constants';

// ═══════════════════════════════════════════════════════════════════
// Group 1: Controller Decorator
// ═══════════════════════════════════════════════════════════════════

describe('Decorators > @Controller', () => {
  test('should set CONTROLLER_WATERMARK to true', () => {
    @Controller('/test')
    class TestCtrl {}
    expect(Reflect.getMetadata(CONTROLLER_WATERMARK, TestCtrl)).toBe(true);
  });

  test('should set path metadata', () => {
    @Controller('/users')
    class UsersCtrl {}
    expect(Reflect.getMetadata(PATH_METADATA, UsersCtrl)).toBe('/users');
  });

  test('should default to "/" when no path given', () => {
    @Controller()
    class DefaultCtrl {}
    expect(Reflect.getMetadata(PATH_METADATA, DefaultCtrl)).toBe('/');
  });
});

// ═══════════════════════════════════════════════════════════════════
// Group 2: HTTP Method Decorators
// ═══════════════════════════════════════════════════════════════════

describe('Decorators > HTTP Methods', () => {
  test('@Get should set GET method metadata', () => {
    class C { @Get('/items') handler() {} }
    expect(Reflect.getMetadata(METHOD_METADATA, C.prototype.handler)).toBe('get');
    expect(Reflect.getMetadata(PATH_METADATA, C.prototype.handler)).toBe('/items');
  });

  test('@Post should set POST method metadata', () => {
    class C { @Post('/items') handler() {} }
    expect(Reflect.getMetadata(METHOD_METADATA, C.prototype.handler)).toBe('post');
  });

  test('@Put should set PUT method metadata', () => {
    class C { @Put('/items/:id') handler() {} }
    expect(Reflect.getMetadata(METHOD_METADATA, C.prototype.handler)).toBe('put');
  });

  test('@Delete should set DELETE method metadata', () => {
    class C { @Delete('/items/:id') handler() {} }
    expect(Reflect.getMetadata(METHOD_METADATA, C.prototype.handler)).toBe(RequestMethod.DELETE);
  });

  test('@Patch should set PATCH method metadata', () => {
    class C { @Patch('/items/:id') handler() {} }
    expect(Reflect.getMetadata(METHOD_METADATA, C.prototype.handler)).toBe('patch');
  });

  test('should default to "/" when no path given', () => {
    class C { @Get() handler() {} }
    expect(Reflect.getMetadata(PATH_METADATA, C.prototype.handler)).toBe('/');
  });
});

// ═══════════════════════════════════════════════════════════════════
// Group 3: Pipeline Decorators (Guard, Interceptor, Pipe, Filter)
// ═══════════════════════════════════════════════════════════════════

describe('Decorators > Pipeline', () => {
  test('@UseGuards should attach single guard to method', () => {
    class MyGuard { canActivate() { return true; } }
    class C { @UseGuards(MyGuard) handler() {} }
    const guards = Reflect.getMetadata(GUARDS_METADATA, C.prototype.handler);
    expect(guards).toEqual([MyGuard]);
  });

  test('@UseGuards should attach multiple guards', () => {
    class G1 { canActivate() { return true; } }
    class G2 { canActivate() { return true; } }
    class C { @UseGuards(G1, G2) handler() {} }
    const guards = Reflect.getMetadata(GUARDS_METADATA, C.prototype.handler);
    expect(guards).toEqual([G1, G2]);
  });

  test('@UseGuards should work on class level', () => {
    class G1 { canActivate() { return true; } }
    @UseGuards(G1)
    class C {}
    const guards = Reflect.getMetadata(GUARDS_METADATA, C);
    expect(guards).toEqual([G1]);
  });

  test('@UseInterceptors should attach to method', () => {
    class MyInterceptor { intercept() {} }
    class C { @UseInterceptors(MyInterceptor) handler() {} }
    const ints = Reflect.getMetadata(INTERCEPTORS_METADATA, C.prototype.handler);
    expect(ints).toEqual([MyInterceptor]);
  });

  test('@UsePipes should attach pipe to method', () => {
    class MyPipe { transform(v: any) { return v; } }
    class C { @UsePipes(MyPipe) handler() {} }
    const pipes = Reflect.getMetadata(PIPES_METADATA, C.prototype.handler);
    expect(pipes).toEqual([MyPipe]);
  });

  test('@UseFilters should attach filter to method', () => {
    class MyFilter { catch() {} }
    class C { @UseFilters(MyFilter) handler() {} }
    const filters = Reflect.getMetadata(FILTERS_METADATA, C.prototype.handler);
    expect(filters).toEqual([MyFilter]);
  });
});

// ═══════════════════════════════════════════════════════════════════
// Group 4: @Throttle Decorator
// ═══════════════════════════════════════════════════════════════════

describe('Decorators > @Throttle', () => {
  test('should store limit and ttl on method', () => {
    class C { @Throttle({ limit: 5, ttl: 30 }) handler() {} }
    const m = Reflect.getMetadata(THROTTLE_METADATA, C.prototype.handler);
    expect(m).toEqual({ limit: 5, ttl: 30 });
  });

  test('should store on class', () => {
    @Throttle({ limit: 20, ttl: 120 })
    class C {}
    const m = Reflect.getMetadata(THROTTLE_METADATA, C);
    expect(m).toEqual({ limit: 20, ttl: 120 });
  });

  test('should use defaults (10 req / 60s)', () => {
    class C { @Throttle() handler() {} }
    const m = Reflect.getMetadata(THROTTLE_METADATA, C.prototype.handler);
    expect(m).toEqual({ limit: 10, ttl: 60 });
  });
});

// ═══════════════════════════════════════════════════════════════════
// Group 5: @UseMiddleware Decorator
// ═══════════════════════════════════════════════════════════════════

describe('Decorators > @UseMiddleware', () => {
  @Injectable()
  class LogMw { use() {} }
  @Injectable()
  class AuthMw { use() {} }

  test('should store single middleware on method', () => {
    class C { @UseMiddleware(LogMw) handler() {} }
    const m = Reflect.getMetadata(USE_MIDDLEWARE_METADATA, C.prototype.handler);
    expect(m).toEqual([LogMw]);
  });

  test('should store multiple middlewares on method', () => {
    class C { @UseMiddleware(LogMw, AuthMw) handler() {} }
    const m = Reflect.getMetadata(USE_MIDDLEWARE_METADATA, C.prototype.handler);
    expect(m).toEqual([LogMw, AuthMw]);
  });

  test('should store on class level', () => {
    @UseMiddleware(AuthMw)
    class C {}
    const m = Reflect.getMetadata(USE_MIDDLEWARE_METADATA, C);
    expect(m).toEqual([AuthMw]);
  });
});

// ═══════════════════════════════════════════════════════════════════
// Group 6: @RateLimit Decorator
// ═══════════════════════════════════════════════════════════════════

describe('Decorators > @RateLimit', () => {
  test('should store max and duration on method', () => {
    class C { @RateLimit({ max: 100, duration: 60 }) handler() {} }
    const m = Reflect.getMetadata(RATE_LIMIT_METADATA, C.prototype.handler);
    expect(m.max).toBe(100);
    expect(m.duration).toBe(60);
  });
});

// ═══════════════════════════════════════════════════════════════════
// Group 7: @Sse Decorator
// ═══════════════════════════════════════════════════════════════════

describe('Decorators > @Sse', () => {
  test('should store SSE path metadata', () => {
    class C { @Sse('/stream') handler() {} }
    const path = Reflect.getMetadata(SSE_METADATA, C.prototype.handler);
    expect(path).toBe('/stream');
  });
});

// ═══════════════════════════════════════════════════════════════════
// Group 8: Cache Decorators
// ═══════════════════════════════════════════════════════════════════

describe('Decorators > Cache', () => {
  test('@CacheKey should store custom key', () => {
    class C { @CacheKey('my-key') handler() {} }
    const key = Reflect.getMetadata('cache_module:cache_key', C.prototype.handler);
    expect(key).toBe('my-key');
  });

  test('@CacheTTL should store custom TTL', () => {
    class C { @CacheTTL(120) handler() {} }
    const ttl = Reflect.getMetadata('cache_module:cache_ttl', C.prototype.handler);
    expect(ttl).toBe(120);
  });
});
