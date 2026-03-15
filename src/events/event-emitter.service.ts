import { Injectable } from '../di/injectable.decorator';
import { ON_EVENT_METADATA } from './on-event.decorator';
import { Logger } from '../services/logger.service';

interface EventHandler {
  methodName: string;
  eventName: string;
}

/**
 * EventEmitterService provides a simple pub/sub event system.
 * 
 * @example
 * ```ts
 * // Emit from any service:
 * this.eventEmitter.emit('user.created', { email: 'a@b.com' });
 * 
 * // Listen with @OnEvent:
 * @OnEvent('user.created')
 * handleUserCreated(data: { email: string }) { ... }
 * ```
 */
@Injectable()
export class EventEmitterService {
  private readonly logger = new Logger('EventEmitter');
  private listeners = new Map<string, Array<{ instance: object; methodName: string }>>();

  /**
   * Register all @OnEvent handlers from a provider instance.
   */
  registerHandlers(instance: object) {
    const constructor = instance.constructor;
    const handlers: EventHandler[] = Reflect.getMetadata(ON_EVENT_METADATA, constructor) || [];

    for (const handler of handlers) {
      const existing = this.listeners.get(handler.eventName) || [];
      existing.push({ instance, methodName: handler.methodName });
      this.listeners.set(handler.eventName, existing);
    }
  }

  /**
   * Emit an event. All registered @OnEvent handlers for this event will be called.
   */
  async emit(eventName: string, payload?: unknown): Promise<void> {
    const handlers = this.listeners.get(eventName) || [];
    
    await Promise.all(
      handlers.map(async (h) => {
        try {
          const method = (h.instance as Record<string, Function>)[h.methodName];
          if (typeof method === 'function') {
            await method.call(h.instance, payload);
          }
        } catch (error) {
          this.logger.error(`Error in handler for "${eventName}":`, String(error));
        }
      })
    );
  }

  /**
   * Emit an event synchronously (fire-and-forget).
   */
  emitAsync(eventName: string, payload?: unknown): void {
    this.emit(eventName, payload).catch((err) =>
      this.logger.error(`Unhandled error emitting "${eventName}":`, String(err)),
    );
  }

  /**
   * Remove all handlers registered for a specific event.
   * Call this when a listener class is being destroyed (e.g., during testing).
   */
  removeListeners(eventName: string): void {
    this.listeners.delete(eventName);
  }

  /** Remove all registered event handlers (useful for test teardown). */
  clearAllListeners(): void {
    this.listeners.clear();
  }
}
