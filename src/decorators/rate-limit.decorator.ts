import 'reflect-metadata';

export const RATE_LIMIT_METADATA = 'RATE_LIMIT_METADATA';

export interface RateLimitOptions {
  /**
   * Maximum number of requests allowed during the duration.
   * Default: 100
   */
  max?: number;

  /**
   * Duration in seconds.
   * Default: 60
   */
  duration?: number;
}

/**
 * Applies rate limiting to a specific controller route or entire controller.
 * @param options Rate Limit configuration options
 */
export function RateLimit(options?: RateLimitOptions): MethodDecorator & ClassDecorator {
  return (target: any, propertyKey?: string | symbol, descriptor?: PropertyDescriptor) => {
    if (descriptor) {
      // Method Level Decorator
      Reflect.defineMetadata(RATE_LIMIT_METADATA, options || {}, descriptor.value!);
      return descriptor;
    }
    // Class Level Decorator
    Reflect.defineMetadata(RATE_LIMIT_METADATA, options || {}, target);
    return target;
  };
}
