import 'reflect-metadata';

export const CRON_METADATA = '__cron__';

/**
 * Cron decorator - marks a method to be called on a cron schedule.
 * Uses croner for scheduling.
 *
 * Example usage:
 *   Cron('0 0 * * *')      -> every day at midnight
 *   Cron('0 * * * *')      -> every hour
 *   Cron('* /5 * * * *')   -> every 5 minutes (remove space)
 */
export function Cron(expression: string, name?: string): MethodDecorator {
  return (target: object | Function, key: string | symbol, descriptor: PropertyDescriptor) => {
    const existing = Reflect.getMetadata(CRON_METADATA, target.constructor) || [];
    existing.push({
      methodName: key as string,
      expression,
      name: name || key as string,
    });
    Reflect.defineMetadata(CRON_METADATA, existing, target.constructor);
    return descriptor;
  };
}
