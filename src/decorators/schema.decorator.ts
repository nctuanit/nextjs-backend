import 'reflect-metadata';
import type { TSchema } from '@sinclair/typebox';

import { SCHEMA_METADATA } from '../constants';

export interface RouteSchema {
  body?: TSchema;
  query?: TSchema;
  params?: TSchema;
  headers?: TSchema;
  response?: TSchema | Record<number, TSchema>;
}

export function Schema(schema: RouteSchema): MethodDecorator {
  return (target: object | Function, key: string | symbol, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata(SCHEMA_METADATA, schema, descriptor.value);
    return descriptor;
  };
}
