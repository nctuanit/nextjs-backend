# Cache Module

The `CacheModule` provides response caching with TTL support, backed by in-memory or custom stores.

## Setup

```typescript
import { Module, CacheModule } from 'next-js-backend';

@Module({
  imports: [
    CacheModule.register({
      ttl: 60,       // Default TTL in seconds
      maxSize: 1000, // Max cached items (FIFO eviction)
    }),
  ],
})
export class AppModule {}
```

## Caching Routes

Use `CacheInterceptor` with the `@CacheKey` and `@CacheTtl` decorators:

```typescript
import { CacheInterceptor, CacheKey, CacheTtl } from 'next-js-backend';
import { UseInterceptors } from 'next-js-backend';

@Controller('/products')
export class ProductController {
  @Get('/')
  @UseInterceptors(CacheInterceptor)
  @CacheKey('all-products')
  @CacheTtl(300) // 5 minutes
  findAll() {
    return this.productService.findAll();
  }

  @Get('/featured')
  @UseInterceptors(CacheInterceptor)
  // No CacheKey → uses route path as key
  // No CacheTtl → uses module default
  getFeatured() {
    return this.productService.getFeatured();
  }
}
```

## Cache Store

The default `MemoryCacheStore` is bounded to `maxSize` items with FIFO eviction:

```typescript
import { MemoryCacheStore } from 'next-js-backend';

const store = new MemoryCacheStore({ maxSize: 500 });
await store.set('key', { data: 'value' }, 60);
const value = await store.get('key');
await store.delete('key');
await store.clear();
```

## Custom Cache Store

Implement `CacheStore`:

```typescript
import type { CacheStore } from 'next-js-backend';
import Redis from 'ioredis';

export class RedisCacheStore implements CacheStore {
  constructor(private redis: Redis) {}

  async get<T>(key: string): Promise<T | null> {
    const val = await this.redis.get(key);
    return val ? JSON.parse(val) : null;
  }

  async set(key: string, value: unknown, ttl: number): Promise<void> {
    await this.redis.set(key, JSON.stringify(value), 'EX', ttl);
  }

  async delete(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async clear(): Promise<void> {
    const keys = await this.redis.keys('cache:*');
    if (keys.length) await this.redis.del(...keys);
  }
}
```

```typescript
CacheModule.register({
  store: new RedisCacheStore(redisClient),
  ttl: 120,
})
```
