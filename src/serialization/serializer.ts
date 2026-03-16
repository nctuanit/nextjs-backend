import { EXCLUDE_METADATA, EXPOSE_METADATA, TRANSFORM_METADATA, type TransformFn } from '../decorators/serialize.decorator';

/**
 * Serialize a plain object or class instance into a safe response payload.
 * - Strips `@Exclude()` fields
 * - In whitelist mode, only includes `@Expose()` fields
 * - Applies `@Transform()` functions
 */
export function serializeObject(
  value: unknown,
  dto: new (...args: unknown[]) => unknown,
  options: { whitelist?: boolean; excludeNullish?: boolean } = {},
): unknown {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) {
    return value.map((item) => serializeObject(item, dto, options));
  }
  if (typeof value !== 'object') return value;

  const obj = value as Record<string, unknown>;

  const excludedFields: string[] = Reflect.getMetadata(EXCLUDE_METADATA, dto) ?? [];
  const exposedFields: string[] = Reflect.getMetadata(EXPOSE_METADATA, dto) ?? [];
  const transforms: Record<string, TransformFn> = Reflect.getMetadata(TRANSFORM_METADATA, dto) ?? {};

  const result: Record<string, unknown> = {};

  for (const key of Object.keys(obj)) {
    // Whitelist mode: only include @Expose() fields
    if (options.whitelist && exposedFields.length > 0 && !exposedFields.includes(key)) {
      continue;
    }
    // Skip @Exclude() fields
    if (excludedFields.includes(key)) {
      continue;
    }
    // Skip nullish if requested
    if (options.excludeNullish && (obj[key] === null || obj[key] === undefined)) {
      continue;
    }

    // Apply @Transform() if present
    const transformFn = transforms[key];
    const val = transformFn ? transformFn(obj[key], obj) : obj[key];

    result[key] = val;
  }

  return result;
}
