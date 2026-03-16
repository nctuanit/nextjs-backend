import 'reflect-metadata';

export const VERSION_METADATA = 'VERSION_METADATA';

export type VersionValue = string | string[];

/**
 * Set the API version for a controller or a specific route handler.
 * Works together with `versioning` options passed to `ElysiaFactory.create()`.
 *
 * @example
 * ```ts
 * // URI versioning: GET /v1/users
 * @Controller('/users')
 * @Version('1')
 * export class UserV1Controller {}
 *
 * // Multiple versions on a method
 * @Get('/items')
 * @Version(['1', '2'])
 * getItems() {}
 * ```
 */
export function Version(version: VersionValue): MethodDecorator {
  const versions = Array.isArray(version) ? version : [version];
  return (_target, _key, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata(VERSION_METADATA, versions, descriptor.value);
    return descriptor;
  };
}

/**
 * Set the API version at the controller (class) level.
 * All routes in the controller inherit this version unless overridden by `@Version()` on a method.
 */
export function ControllerVersion(version: VersionValue): ClassDecorator {
  const versions = Array.isArray(version) ? version : [version];
  return (target) => {
    Reflect.defineMetadata(VERSION_METADATA, versions, target);
  };
}
