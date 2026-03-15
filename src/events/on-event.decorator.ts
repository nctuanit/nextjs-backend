import 'reflect-metadata';

export const ON_EVENT_METADATA = '__on_event__';

/**
 * @OnEvent(eventName) decorator
 * Marks a method as an event handler.
 * 
 * @example
 * ```ts
 * @Injectable()
 * export class NotificationService {
 *   @OnEvent('user.created')
 *   async sendWelcomeEmail(payload: { email: string }) {
 *     console.log('Sending welcome email to', payload.email);
 *   }
 * }
 * ```
 */
export function OnEvent(eventName: string): MethodDecorator {
  return (target: object | Function, key: string | symbol, descriptor: PropertyDescriptor) => {
    const existing = Reflect.getMetadata(ON_EVENT_METADATA, target.constructor) || [];
    existing.push({
      methodName: key as string,
      eventName,
    });
    Reflect.defineMetadata(ON_EVENT_METADATA, existing, target.constructor);
    return descriptor;
  };
}
