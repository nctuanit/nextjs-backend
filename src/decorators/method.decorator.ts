import 'reflect-metadata';

import { METHOD_METADATA, PATH_METADATA } from '../constants';

export enum RequestMethod {
  GET = 'get',
  POST = 'post',
  PUT = 'put',
  DELETE = 'delete',
  PATCH = 'patch',
  ALL = 'all',
  OPTIONS = 'options',
  HEAD = 'head',
}

const createMappingDecorator = (method: RequestMethod) => {
  return (path: string = '/'): MethodDecorator => {
    return (target: object | Function, key: string | symbol, descriptor: PropertyDescriptor) => {
      // Ensure paths start with / 
      const normalizedPath = path.startsWith('/') ? path : `/${path}`;
      
      Reflect.defineMetadata(PATH_METADATA, normalizedPath, descriptor.value);
      Reflect.defineMetadata(METHOD_METADATA, method, descriptor.value);
      
      return descriptor;
    };
  };
};

export const Get = createMappingDecorator(RequestMethod.GET);
export const Post = createMappingDecorator(RequestMethod.POST);
export const Put = createMappingDecorator(RequestMethod.PUT);
export const Delete = createMappingDecorator(RequestMethod.DELETE);
export const Patch = createMappingDecorator(RequestMethod.PATCH);
export const Options = createMappingDecorator(RequestMethod.OPTIONS);
export const Head = createMappingDecorator(RequestMethod.HEAD);
export const All = createMappingDecorator(RequestMethod.ALL);
