import { type Context } from 'elysia';
import { type Provider, type Type } from './di/provider';

export interface CanActivate {
  canActivate(context: Context): boolean | Promise<boolean>;
}

export interface NestMiddleware<TRequest = unknown, TResponse = unknown> {
  use(req: TRequest, res: TResponse, next: () => void | Promise<void>): void | Promise<void>;
}

export interface NestInterceptor<T = unknown, R = unknown> {
  intercept(context: Context, next: () => Promise<R>): Promise<R>;
}

export interface ExceptionFilter<T = unknown> {
  catch(exception: T, context: Context): unknown | Promise<unknown>;
}

export interface PipeTransform<T = unknown, R = unknown> {
  transform(value: T, metadata: ArgumentMetadata, context: Context): R | Promise<R>;
}

export interface ArgumentMetadata {
  type: 'body' | 'query' | 'param' | 'custom' | 'headers';
  metatype?: Type<unknown> | Function;
  data?: string;
}

export interface DynamicModule {
  module: Type<unknown>;
  providers?: Provider[];
  controllers?: Type<unknown>[];
  imports?: Array<Type<unknown> | DynamicModule | Promise<DynamicModule>>;
  exports?: Array<Type<unknown> | Provider | string | symbol>;
}

