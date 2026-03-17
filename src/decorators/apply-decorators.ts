/**
 * Utility function that composes multiple decorators into a single one.
 * Useful for grouping related decorators to reduce boilerplate.
 * 
 * @param decorators - An array of class, method, or property decorators.
 */
export function applyDecorators(
  ...decorators: Array<ClassDecorator | MethodDecorator | PropertyDecorator>
) {
  return function (
    target: object | Function,
    propertyKey?: string | symbol,
    descriptor?: TypedPropertyDescriptor<any>,
  ) {
    for (const decorator of decorators) {
      if (target instanceof Function && !descriptor) {
        // Class decorator
        (decorator as ClassDecorator)(target as Function);
        continue;
      }
      
      // Method / Property decorator
      (decorator as MethodDecorator | PropertyDecorator)(
        target,
        propertyKey!,
        descriptor as any, // Cast as requested, usually applied effectively by TS
      );
    }
  };
}
