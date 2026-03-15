import 'reflect-metadata';

import { MODULE_METADATA } from '../constants';

export interface ModuleMetadata {
  imports?: unknown[];
  controllers?: unknown[];
  providers?: unknown[];
  exports?: unknown[];
}

/**
 * Decorator that marks a class as a module.
 *
 * Modules are used by the library to organize the application structure into scopes.
 * Controllers and providers must be declared in a module to be discovered by the library.
 *
 * @param metadata Module configuration metadata
 */
export function Module(metadata: ModuleMetadata): ClassDecorator {
  return (target: object | Function) => {
    for (const property in metadata) {
      if (metadata.hasOwnProperty(property)) {
        Reflect.defineMetadata(property, (metadata as any)[property], target);
      }
    }
  };
}
