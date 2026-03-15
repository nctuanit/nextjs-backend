import 'reflect-metadata';
import { type Type } from '../di/provider';

export const USE_MIDDLEWARE_METADATA = 'USE_MIDDLEWARE_METADATA';

/**
 * Apply middleware to a specific route method or entire controller.
 *
 * Usage:
 *   @UseMiddleware(LoggingMiddleware, AuthMiddleware)
 *   @Get('/data')
 *   getData() { ... }
 */
export function UseMiddleware(...middlewares: Type<any>[]): MethodDecorator & ClassDecorator {
  return (target: any, propertyKey?: string | symbol, descriptor?: PropertyDescriptor) => {
    if (descriptor) {
      const existing = Reflect.getMetadata(USE_MIDDLEWARE_METADATA, descriptor.value!) || [];
      Reflect.defineMetadata(USE_MIDDLEWARE_METADATA, [...existing, ...middlewares], descriptor.value!);
      return descriptor;
    }
    const existing = Reflect.getMetadata(USE_MIDDLEWARE_METADATA, target) || [];
    Reflect.defineMetadata(USE_MIDDLEWARE_METADATA, [...existing, ...middlewares], target);
    return target;
  };
}
