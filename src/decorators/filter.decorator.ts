import 'reflect-metadata';
import { FILTERS_METADATA } from '../constants';

/**
 * Decorator that binds exception filters to the scope of the controller or method.
 * 
 * @param filters One or more filter instances or classes to use.
 */
export function UseFilters(...filters: (Function | Record<string, any>)[]): MethodDecorator & ClassDecorator {
  return (
    target: any,
    propertyKey?: string | symbol,
    descriptor?: TypedPropertyDescriptor<any>,
  ) => {
    if (descriptor) {
      Reflect.defineMetadata(FILTERS_METADATA, filters, descriptor.value!);
      return descriptor;
    }
    Reflect.defineMetadata(FILTERS_METADATA, filters, target);
    return target;
  };
}
