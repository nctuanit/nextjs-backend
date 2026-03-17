# Interceptors

Interceptors transform the request/response cycle. Typical use cases: logging, response transformation, caching, error mapping.

## Creating an Interceptor

Implement the `NestInterceptor` interface:

```typescript
import { Injectable, type NestInterceptor } from 'next-js-backend';
import type { Context } from 'elysia';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  async intercept(context: Context, next: () => Promise<unknown>): Promise<unknown> {
    const start = Date.now();
    const url = new URL(context.request.url).pathname;

    const result = await next();

    Logger.log(`[${context.request.method}] ${url} — ${Date.now() - start}ms`);
    return result;
  }
}
```

## Applying Interceptors

### Method-level

```typescript
import { UseInterceptors } from 'next-js-backend';

@Get('/')
@UseInterceptors(LoggingInterceptor)
findAll() {
  return this.service.findAll();
}
```

### Controller-level

```typescript
@Controller('/users')
@UseInterceptors(LoggingInterceptor)
export class UserController { ... }
```

## Response Transformation

Wrap every response in a common envelope:

```typescript
@Injectable()
export class TransformInterceptor implements NestInterceptor {
  async intercept(context: Context, next: () => Promise<unknown>) {
    const data = await next();
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }
}
```

## Error Interception

```typescript
@Injectable()
export class ErrorsInterceptor implements NestInterceptor {
  async intercept(context: Context, next: () => Promise<unknown>) {
    try {
      return await next();
    } catch (error) {
      // Map or log errors
      throw error;
    }
  }
}
```

## Built-in: CacheInterceptor

```typescript
import { CacheInterceptor } from 'next-js-backend';
import { CacheKey, CacheTtl } from 'next-js-backend';

@Get('/products')
@UseInterceptors(CacheInterceptor)
@CacheKey('products-list')
@CacheTtl(60) // 60 seconds
findAll() {
  return this.productService.findAll();
}
```

## Execution Order

Multiple interceptors wrap from outer to inner:

```
Interceptor 1 → Interceptor 2 → Handler → Interceptor 2 → Interceptor 1
```
