import 'reflect-metadata';

/**
 * Decorator that assigns custom metadata to a class or a method.
 * 
 * @param metadataKey - The key to store the metadata under.
 * @param metadataValue - The value to store.
 */
export const SetMetadata = <K = string, V = any>(
  metadataKey: K,
  metadataValue: V,
): MethodDecorator & ClassDecorator => {
  return (
    target: object | Function,
    key?: string | symbol,
    descriptor?: any,
  ) => {
    if (descriptor) {
      // Method decorator
      Reflect.defineMetadata(metadataKey, metadataValue, descriptor.value);
      return descriptor;
    }
    // Class decorator
    Reflect.defineMetadata(metadataKey, metadataValue, target);
    return target;
  };
};
