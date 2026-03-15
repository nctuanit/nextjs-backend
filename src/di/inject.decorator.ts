import 'reflect-metadata';
import { type InjectionToken } from './provider';

/**
 * Decorator that marks a constructor parameter as a custom injection token.
 * 
 * @param token The custom injection token (string or symbol)
 */
export function Inject(token: InjectionToken): ParameterDecorator {
  return (target: Object, propertyKey: string | symbol | undefined, parameterIndex: number) => {
    const injections = Reflect.getMetadata('custom:inject', target) || [];
    injections.push({ index: parameterIndex, token });
    Reflect.defineMetadata('custom:inject', injections, target);
  };
}
