import 'reflect-metadata';

export const CACHE_KEY_METADATA = 'cache_module:cache_key';
export const CACHE_TTL_METADATA = 'cache_module:cache_ttl';

/**
 * Defines a custom key to be used for caching the endpoint response
 * 
 * @param key The cache key
 */
export function CacheKey(key: string): MethodDecorator {
  return (target, propertyKey, descriptor) => {
    Reflect.defineMetadata(CACHE_KEY_METADATA, key, descriptor.value!);
    return descriptor;
  };
}

/**
 * Defines the TTL (Time-To-Live) for the cached response
 * 
 * @param ttl Time in milliseconds
 */
export function CacheTTL(ttl: number): MethodDecorator {
  return (target, propertyKey, descriptor) => {
    Reflect.defineMetadata(CACHE_TTL_METADATA, ttl, descriptor.value!);
    return descriptor;
  };
}
