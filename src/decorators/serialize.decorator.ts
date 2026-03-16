import 'reflect-metadata';

export const SERIALIZE_METADATA = 'SERIALIZE_METADATA';
export const EXCLUDE_METADATA = 'EXCLUDE_METADATA';
export const EXPOSE_METADATA = 'EXPOSE_METADATA';
export const TRANSFORM_METADATA = 'TRANSFORM_METADATA';

export type TransformFn<T = unknown, R = unknown> = (value: T, obj: Record<string, unknown>) => R;

export interface SerializeOptions {
  /** If true, only `@Expose()` properties are included (whitelist mode). Default: false */
  whitelist?: boolean;
  /** Exclude properties with null/undefined values */
  excludeNullish?: boolean;
}

/**
 * Serialize the response using a DTO class.
 * Properties with `@Exclude()` are stripped from the response.
 * In whitelist mode, only `@Expose()` properties are included.
 *
 * @example
 * ```ts
 * @Get('/:id')
 * @Serialize(UserResponseDto)
 * async findOne(@Param('id') id: string) {
 *   return this.userService.findOne(id); // password field auto-stripped
 * }
 * ```
 */
export function Serialize(dto: new (...args: unknown[]) => unknown, options?: SerializeOptions): MethodDecorator {
  return (_target, _key, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata(SERIALIZE_METADATA, { dto, options: options ?? {} }, descriptor.value);
    return descriptor;
  };
}

/**
 * Mark a property to be excluded from serialized output.
 *
 * @example
 * ```ts
 * class UserDto {
 *   @Exclude()
 *   password: string;
 * }
 * ```
 */
export function Exclude(): PropertyDecorator {
  return (target, propertyKey) => {
    const existing: string[] = Reflect.getMetadata(EXCLUDE_METADATA, target.constructor) ?? [];
    Reflect.defineMetadata(EXCLUDE_METADATA, [...existing, String(propertyKey)], target.constructor);
  };
}

/**
 * Mark a property to be explicitly included in whitelist mode.
 *
 * @example
 * ```ts
 * class UserDto {
 *   @Expose() id: string;
 *   @Expose() name: string;
 * }
 * ```
 */
export function Expose(): PropertyDecorator {
  return (target, propertyKey) => {
    const existing: string[] = Reflect.getMetadata(EXPOSE_METADATA, target.constructor) ?? [];
    Reflect.defineMetadata(EXPOSE_METADATA, [...existing, String(propertyKey)], target.constructor);
  };
}

/**
 * Apply a transform function to a property's value during serialization.
 *
 * @example
 * ```ts
 * class UserDto {
 *   @Transform((val) => val?.toUpperCase())
 *   name: string;
 * }
 * ```
 */
export function Transform<T = unknown, R = unknown>(fn: TransformFn<T, R>): PropertyDecorator {
  return (target, propertyKey) => {
    const existing: Record<string, TransformFn> = Reflect.getMetadata(TRANSFORM_METADATA, target.constructor) ?? {};
    Reflect.defineMetadata(TRANSFORM_METADATA, { ...existing, [String(propertyKey)]: fn }, target.constructor);
  };
}
