import { describe, test, expect } from 'bun:test';
import 'reflect-metadata';

import { Injectable } from '../../src/di/injectable.decorator';
import { Cron, CRON_METADATA } from '../../src/schedule/cron.decorator';
import { EventEmitterService } from '../../src/events/event-emitter.service';
import { OnEvent, ON_EVENT_METADATA } from '../../src/events/on-event.decorator';

// ─── @Cron tests ─────────────────────────────────────────────────

describe('@Cron decorator', () => {
  test('should store cron metadata on the class', () => {
    @Injectable()
    class TasksService {
      @Cron('*/5 * * * *')
      every5Minutes() {}

      @Cron('0 0 * * *', 'daily-cleanup')
      dailyCleanup() {}
    }

    const metadata = Reflect.getMetadata(CRON_METADATA, TasksService);
    expect(metadata).toHaveLength(2);
    expect(metadata[0].expression).toBe('*/5 * * * *');
    expect(metadata[0].methodName).toBe('every5Minutes');
    expect(metadata[1].expression).toBe('0 0 * * *');
    expect(metadata[1].name).toBe('daily-cleanup');
  });
});

// ─── @OnEvent / EventEmitter tests ──────────────────────────────

describe('EventEmitterService', () => {
  test('should register and emit events', async () => {
    const results: string[] = [];

    @Injectable()
    class NotificationHandler {
      @OnEvent('user.created')
      onUserCreated(data: { email: string }) {
        results.push(`welcome:${data.email}`);
      }
    }

    const emitter = new EventEmitterService();
    const handler = new NotificationHandler();
    emitter.registerHandlers(handler);

    await emitter.emit('user.created', { email: 'test@example.com' });

    expect(results).toEqual(['welcome:test@example.com']);
  });

  test('should support multiple handlers for the same event', async () => {
    const results: string[] = [];

    @Injectable()
    class HandlerA {
      @OnEvent('order.placed')
      sendReceipt(data: any) {
        results.push('receipt');
      }
    }

    @Injectable()
    class HandlerB {
      @OnEvent('order.placed')
      updateInventory(data: any) {
        results.push('inventory');
      }
    }

    const emitter = new EventEmitterService();
    emitter.registerHandlers(new HandlerA());
    emitter.registerHandlers(new HandlerB());

    await emitter.emit('order.placed', { orderId: 1 });

    expect(results).toContain('receipt');
    expect(results).toContain('inventory');
    expect(results).toHaveLength(2);
  });

  test('should not crash on unhandled events', async () => {
    const emitter = new EventEmitterService();
    // Should not throw
    await emitter.emit('nonexistent.event', {});
  });
});
