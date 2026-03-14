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
}

import { type TSchema } from '@sinclair/typebox';

export interface RouteParamMetadata {
  index: number;
  data?: string;
  schema?: TSchema;
}

export function assignMetadata(
  args: Record<string, RouteParamMetadata>,
  paramtype: RouteParamtypes,
  index: number,
  data?: string,
  schema?: TSchema
) {
  return {
    ...args,
    [`${paramtype}:${index}`]: {
      index,
      data,
      schema
    },
  };
}

const createParamDecorator = (paramtype: RouteParamtypes) => {
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

// Body is special, usually the first arg is the schema if no key is provided
export const Body = (dataOrSchema?: string | TSchema, schema?: TSchema): ParameterDecorator => {
  let dataVal: string | undefined;
  let schemaVal: TSchema | undefined = schema;

  if (typeof dataOrSchema === 'string') {
    dataVal = dataOrSchema;
  } else if (dataOrSchema !== undefined) {
    schemaVal = dataOrSchema;
  }

  return createParamDecorator(RouteParamtypes.BODY)(dataVal, schemaVal);
}

export const Param = createParamDecorator(RouteParamtypes.PARAM);
export const Query = createParamDecorator(RouteParamtypes.QUERY);
export const Headers = createParamDecorator(RouteParamtypes.HEADERS);
export const Req = createParamDecorator(RouteParamtypes.REQUEST);
export const Request = Req;
export const Res = createParamDecorator(RouteParamtypes.RESPONSE);
export const Session = createParamDecorator(RouteParamtypes.SESSION);
export const File = createParamDecorator(RouteParamtypes.FILE);
export const Files = createParamDecorator(RouteParamtypes.FILES);
