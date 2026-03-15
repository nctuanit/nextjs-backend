import 'reflect-metadata';

export const THROTTLE_METADATA = 'THROTTLE_METADATA';

export interface ThrottleOptions {
  /** Maximum number of requests in the time window. Default: 10 */
  limit?: number;
  /** Time window in seconds. Default: 60 */
  ttl?: number;
}

/**
 * Throttle decorator - limits requests per route or controller.
 *
 * Usage:
 *   @Throttle({ limit: 5, ttl: 60 })  // 5 requests per 60 seconds
 *   @Get('/expensive')
 *   compute() { ... }
 */
export function Throttle(options?: ThrottleOptions): MethodDecorator & ClassDecorator {
  return (target: any, propertyKey?: string | symbol, descriptor?: PropertyDescriptor) => {
    const config = {
      limit: options?.limit ?? 10,
      ttl: options?.ttl ?? 60,
    };
    if (descriptor) {
      Reflect.defineMetadata(THROTTLE_METADATA, config, descriptor.value!);
      return descriptor;
    }
    Reflect.defineMetadata(THROTTLE_METADATA, config, target);
    return target;
  };
}
