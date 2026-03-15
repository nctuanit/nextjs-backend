/**
 * Schedule & Events Integration Tests
 *
 * Tests @Cron metadata, EventEmitter lifecycle, and error handling.
 */
import { describe, test, expect } from 'bun:test';
import 'reflect-metadata';

import { Injectable } from '../../src/di/injectable.decorator';
import { Cron, CRON_METADATA } from '../../src/schedule/cron.decorator';
import { EventEmitterService } from '../../src/events/event-emitter.service';
import { OnEvent } from '../../src/events/on-event.decorator';

// ═══════════════════════════════════════════════════════════════════
// @Cron Tests
// ═══════════════════════════════════════════════════════════════════

describe('Schedule > @Cron', () => {
  test('should register multiple cron schedules per class', () => {
    @Injectable()
    class Jobs {
      @Cron('*/5 * * * *') every5() {}
      @Cron('0 0 * * *', 'daily') daily() {}
      @Cron('0 0 * * 0') weekly() {}
    }

    const meta = Reflect.getMetadata(CRON_METADATA, Jobs);
    expect(meta).toHaveLength(3);
    expect(meta[0].expression).toBe('*/5 * * * *');
    expect(meta[1].name).toBe('daily');
    expect(meta[2].methodName).toBe('weekly');
  });

  test('should store correct methodName for each cron', () => {
    @Injectable()
    class TaskService {
      @Cron('0 * * * *') hourly() {}
    }
    const meta = Reflect.getMetadata(CRON_METADATA, TaskService);
    expect(meta[0].methodName).toBe('hourly');
  });
});

// ═══════════════════════════════════════════════════════════════════
// EventEmitter Tests
// ═══════════════════════════════════════════════════════════════════

describe('Events > EventEmitterService', () => {
  test('should register and call single handler', async () => {
    const results: string[] = [];

    @Injectable()
    class Handler {
      @OnEvent('test.event')
      handle(data: { msg: string }) { results.push(data.msg); }
    }

    const emitter = new EventEmitterService();
    emitter.registerHandlers(new Handler());
    await emitter.emit('test.event', { msg: 'hello' });

    expect(results).toEqual(['hello']);
  });

  test('should handle multiple handlers for same event', async () => {
    const log: number[] = [];

    @Injectable()
    class H1 { @OnEvent('shared') handle() { log.push(1); } }
    @Injectable()
    class H2 { @OnEvent('shared') handle() { log.push(2); } }

    const emitter = new EventEmitterService();
    emitter.registerHandlers(new H1());
    emitter.registerHandlers(new H2());
    await emitter.emit('shared', {});

    expect(log).toContain(1);
    expect(log).toContain(2);
  });

  test('should not crash on unhandled events', async () => {
    const emitter = new EventEmitterService();
    // Should not throw
    expect(async () => {
      await emitter.emit('no.handler', {});
    }).not.toThrow();
  });

  test('should handle async event handlers', async () => {
    const results: string[] = [];

    @Injectable()
    class AsyncHandler {
      @OnEvent('async.event')
      async handle(data: { msg: string }) {
        await new Promise(r => setTimeout(r, 10));
        results.push(data.msg);
      }
    }

    const emitter = new EventEmitterService();
    emitter.registerHandlers(new AsyncHandler());
    await emitter.emit('async.event', { msg: 'async-result' });

    expect(results).toEqual(['async-result']);
  });

  test('should pass correct payload to handler', async () => {
    let received: any = null;

    @Injectable()
    class PayloadHandler {
      @OnEvent('data.received')
      handle(data: any) { received = data; }
    }

    const emitter = new EventEmitterService();
    emitter.registerHandlers(new PayloadHandler());

    const payload = { id: 42, name: 'test', nested: { a: 1 } };
    await emitter.emit('data.received', payload);

    expect(received).toEqual(payload);
  });
});
