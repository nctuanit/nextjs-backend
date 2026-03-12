import 'reflect-metadata';

import { type Context } from 'elysia';

import { INTERCEPTORS_METADATA } from '../constants';
import { type NestInterceptor } from '../interfaces';

export function UseInterceptors(...interceptors: (NestInterceptor | Function)[]): MethodDecorator & ClassDecorator {
  return (target: object | Function, key?: string | symbol, descriptor?: PropertyDescriptor) => {
    if (descriptor) {
      // Method level
      Reflect.defineMetadata(INTERCEPTORS_METADATA, interceptors, descriptor.value);
      return descriptor;
    }
    // Class level
    Reflect.defineMetadata(INTERCEPTORS_METADATA, interceptors, target);
    return target;
  };
}
