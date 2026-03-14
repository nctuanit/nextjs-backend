import { type Context } from 'elysia';
import { type Provider, type Type } from './di/provider';

export interface CanActivate {
  canActivate(context: Context): boolean | Promise<boolean>;
}

export interface NestMiddleware<TRequest = any, TResponse = any> {
  use(req: TRequest, res: TResponse, next: () => void | Promise<void>): any | Promise<any>;
}

export interface NestInterceptor<T = any, R = any> {
  intercept(context: any, next: () => Promise<R>): Promise<R>;
}

export interface ExceptionFilter<T = any> {
  catch(exception: T, context: any): any | Promise<any>;
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

