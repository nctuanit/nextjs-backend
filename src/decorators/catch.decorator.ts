import 'reflect-metadata';
import { Type } from '../di/provider';

export const FILTER_CATCH_EXCEPTIONS = 'FILTER_CATCH_EXCEPTIONS';

/**
 * Decorator that marks a class as a Nest exception filter.
 * An exception filter handles thrown exceptions caught during execution.
 * 
 * @param exceptions One or more exception types that this filter should catch.
 */
export function Catch(...exceptions: Type<any>[]): ClassDecorator {
  return (target: Function) => {
    Reflect.defineMetadata(FILTER_CATCH_EXCEPTIONS, exceptions, target);
  };
}
