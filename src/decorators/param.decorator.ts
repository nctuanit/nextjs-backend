import 'reflect-metadata';

import { ROUTE_ARGS_METADATA } from '../constants';

export enum RouteParamtypes {
  REQUEST,
  RESPONSE,
  NEXT,
  BODY,
  QUERY,
  PARAM,
  HEADERS,
  SESSION,
  FILE,
  FILES,
  HOST,
  IP,
  CUSTOM, // For createParamDecorator
}

import type { Context } from 'elysia';
import { type TSchema } from '@sinclair/typebox';

/** Factory function signature for createParamDecorator */
export type CustomParamFactory<TData = unknown, TOutput = unknown> = (
  data: TData | undefined,
  ctx: Context,
) => TOutput | Promise<TOutput>;

export interface RouteParamMetadata {
  index: number;
  data?: string;
  schema?: TSchema;
  /** For CUSTOM params: the factory to call at request time */
  factory?: CustomParamFactory<unknown, unknown>;
  /** For CUSTOM params: arbitrary data passed by the call-site (e.g. @CurrentUser('email')) */
  customData?: unknown;
}

export function assignMetadata(
  args: Record<string, RouteParamMetadata>,
  paramtype: RouteParamtypes,
  index: number,
  data?: string,
  schema?: TSchema,
  factory?: CustomParamFactory<unknown, unknown>,
  customData?: unknown,
) {
  return {
    ...args,
    [`${paramtype}:${index}`]: {
      index,
      data,
      schema,
      factory,
      customData,
    },
  };
}

const createInternalParamDecorator = (paramtype: RouteParamtypes) => {
  return (data?: string, schema?: TSchema): ParameterDecorator =>
    (target: object | Function, key: string | symbol | undefined, index: number) => {
      if (!key) return;
      const args = Reflect.getMetadata(ROUTE_ARGS_METADATA, target.constructor, key) || {};
      Reflect.defineMetadata(
        ROUTE_ARGS_METADATA,
        assignMetadata(args, paramtype, index, data, schema),
        target.constructor,
        key,
      );
    };
};

/**
 * Create a custom parameter decorator — identical to NestJS `createParamDecorator`.
 *
 * @example
 * ```ts
 * // Define once
 * export const CurrentUser = createParamDecorator(
 *   (data: string | undefined, ctx: Context) => {
 *     const user = ctx.user;
 *     return data ? user?.[data] : user;
 *   },
 * );
 *
 * // Use in controller
 * @Get('/me')
 * getMe(@CurrentUser() user: User) { return user; }
 *
 * @Get('/email')
 * getEmail(@CurrentUser('email') email: string) { return email; }
 * ```
 */
export function createParamDecorator<TData = unknown, TOutput = unknown>(
  factory: CustomParamFactory<TData, TOutput>,
): (data?: TData) => ParameterDecorator {
  return (data?: TData): ParameterDecorator =>
    (target: object | Function, key: string | symbol | undefined, index: number) => {
      if (!key) return;
      const args = Reflect.getMetadata(ROUTE_ARGS_METADATA, target.constructor, key) || {};
      Reflect.defineMetadata(
        ROUTE_ARGS_METADATA,
        assignMetadata(
          args,
          RouteParamtypes.CUSTOM,
          index,
          undefined,
          undefined,
          factory as CustomParamFactory<unknown, unknown>,
          data,   // stored as customData in metadata
        ),
        target.constructor,
        key,
      );
    };
}

// Body is special, usually the first arg is the schema if no key is provided
export const Body = (dataOrSchema?: string | TSchema, schema?: TSchema): ParameterDecorator => {
  let dataVal: string | undefined;
  let schemaVal: TSchema | undefined = schema;

  if (typeof dataOrSchema === 'string') {
    dataVal = dataOrSchema;
  } else if (dataOrSchema !== undefined) {
    schemaVal = dataOrSchema;
  }

  return createInternalParamDecorator(RouteParamtypes.BODY)(dataVal, schemaVal);
}

export const Param = createInternalParamDecorator(RouteParamtypes.PARAM);
export const Query = createInternalParamDecorator(RouteParamtypes.QUERY);
export const Headers = createInternalParamDecorator(RouteParamtypes.HEADERS);
export const Req = createInternalParamDecorator(RouteParamtypes.REQUEST);
export const Request = Req;
export const Res = createInternalParamDecorator(RouteParamtypes.RESPONSE);
export const Session = createInternalParamDecorator(RouteParamtypes.SESSION);
export const File = createInternalParamDecorator(RouteParamtypes.FILE);
export const Files = createInternalParamDecorator(RouteParamtypes.FILES);
