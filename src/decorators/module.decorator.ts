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
    const meta = metadata as Record<string, unknown>;
    for (const property in meta) {
      if (Object.prototype.hasOwnProperty.call(meta, property)) {
        Reflect.defineMetadata(property, meta[property], target);
      }
    }
  };
}
