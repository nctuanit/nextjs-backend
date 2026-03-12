import 'reflect-metadata';

import { type Context } from 'elysia';

import { GUARDS_METADATA } from '../constants';
import { type CanActivate } from '../interfaces';

export function UseGuards(...guards: (CanActivate | Function)[]): MethodDecorator & ClassDecorator {
  return (target: object | Function, key?: string | symbol, descriptor?: PropertyDescriptor) => {
    if (descriptor) {
      // Method level
      Reflect.defineMetadata(GUARDS_METADATA, guards, descriptor.value);
      return descriptor;
    }
    // Class level
    Reflect.defineMetadata(GUARDS_METADATA, guards, target);
    return target;
  };
}
