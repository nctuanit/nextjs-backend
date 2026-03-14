import 'reflect-metadata';
import { Injectable } from '../di/injectable.decorator';

export const MIDDLEWARE_METADATA = 'MIDDLEWARE_METADATA';

/**
 * Decorator that binds middleware to an application module or specific routes.
 */
export function Middleware(): ClassDecorator {
  return (target: Function) => {
    // A middleware is just a special injectable service
    Injectable()(target);
    Reflect.defineMetadata(MIDDLEWARE_METADATA, true, target);
  };
}
