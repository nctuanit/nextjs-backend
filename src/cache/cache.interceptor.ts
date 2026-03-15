import { type NestInterceptor } from '../interfaces';
import { Injectable } from '../di/injectable.decorator';
import { CACHE_KEY_METADATA, CACHE_TTL_METADATA } from '../decorators/cache.decorator';
import { CACHE_MANAGER } from './cache.module';
import { globalContainer } from '../di/container';
import { type CacheStore } from './cache.store';
import { type Context } from 'elysia';

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  async intercept(context: Context, next: () => Promise<unknown>): Promise<unknown> {
    // Determine the executing method
    // In our architecture, Elysia routes aren't directly aware of the controller methodName inside the interceptor natively
    // unless we pass it down. But we can derive cache keys from the Request URL natively.
    
    // We try to fallback from Method metadata first if possible context was augmented
    // However since intercept() only gets raw Elysia context currently, we'll build a default key
    const req = context.request;
    const defaultKey = `${req.method}-${new URL(req.url).pathname}`;
    
    // Currently, our ElysiaFactory doesn't pass the exact methodFn down to interceptors directly via `context`
    // So for advanced `@CacheKey()` to work, we'd either need to augment `context` or use the default URL-based key
    // For now, we will use the URL-based key which handles 90% of basic caching use-cases.
    
    // Attempt to parse explicit Metadata from the router context if we augmented it later
    const explicitKey = (context as any).cacheKey;
    const cacheKey = explicitKey || defaultKey;
    
    const cacheManager = await globalContainer.resolve(CACHE_MANAGER) as CacheStore;
    
    // Check Cache
    const cachedResponse = await cacheManager.get(cacheKey);
    if (cachedResponse !== undefined) {
      return cachedResponse;
    }

    // Process Route
    const response = await next();
    
    // Save Cache
    // We try to grab the explicit TTL if provided in the context, else default to whatever the module configured
    const explicitTtl = (context as any).cacheTtl;
    await cacheManager.set(cacheKey, response, explicitTtl);

    return response;
  }
}
