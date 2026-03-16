import 'reflect-metadata';
import { type Context } from 'elysia';

import { PIPES_METADATA } from '../constants';
import { type PipeTransform } from '../interfaces';

export function UsePipes(...pipes: (PipeTransform | Function)[]): MethodDecorator & ClassDecorator {
  return ((target: any, key?: string | symbol, descriptor?: PropertyDescriptor) => {
    if (descriptor) {
      Reflect.defineMetadata(PIPES_METADATA, pipes, descriptor.value);
      return descriptor;
    }
    Reflect.defineMetadata(PIPES_METADATA, pipes, target);
    return target;
  }) ;
}
