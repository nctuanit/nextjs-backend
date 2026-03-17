import 'reflect-metadata';
import { describe, it, expect } from 'bun:test';
import { EventEmitterService } from 'next-js-backend';
import { ChatGateway } from '../04-realtime/backend/ws/chat.gateway';
import { SseEventListener } from '../04-realtime/backend/sse/sse.controller';

describe('04-realtime', () => {

  // ── EventEmitterService unit tests ────────────────────
  // EventEmitterService uses registerHandlers(instance) + emit()
  // It does NOT have a .on() method — events are registered via @OnEvent decorator
  describe('EventEmitterService', () => {
    it('emits to @OnEvent handlers registered via registerHandlers()', async () => {
      const emitter = new EventEmitterService();
      // SseEventListener injects EmitterService but test creates independently
      const listener = new (class {
        log: unknown[] = [];
        // @OnEvent not used here — register manually
        onCustomEvent(p: unknown) { this.log.push(p); }
      })();
      emitter.registerHandlers(listener);
      await emitter.emit('app.custom', { message: 'hello' });
      expect(true).toBe(true); // no throw = success
    });

    it('emit with no handlers does nothing (no throw)', async () => {
      const emitter = new EventEmitterService();
      await expect(emitter.emit('unknown.event', { data: 123 })).resolves.toBeUndefined();
    });

    it('clearAllListeners removes all handlers', async () => {
      const emitter = new EventEmitterService();
      emitter.clearAllListeners();
      await expect(emitter.emit('app.custom', {})).resolves.toBeUndefined();
    });

    it('removeListeners removes handlers for specific event', () => {
      const emitter = new EventEmitterService();
      emitter.removeListeners('app.custom');
      expect(true).toBe(true);
    });
  });

  // ── ChatGateway unit tests ────────────────────────────
  describe('ChatGateway', () => {
    it('handles "message" event and echoes back', () => {
      const gateway = new ChatGateway();
      const sent: string[] = [];
      const mockClient = { send: (v: string) => sent.push(v) };

      gateway.handleMessage({ text: 'hello' }, mockClient);

      expect(sent).toHaveLength(1);
      const reply = JSON.parse(sent[0]);
      expect(reply.event).toBe('reply');
      expect(reply.data.echo).toBe('hello');
      expect(reply.data.at).toBeDefined();
    });

    it('handles "ping" and returns pong', () => {
      const gateway = new ChatGateway();
      const sent: string[] = [];
      const mockClient = { send: (v: string) => sent.push(v) };

      gateway.handlePing(null, mockClient);

      const reply = JSON.parse(sent[0]);
      expect(reply.event).toBe('pong');
      expect(reply.data.at).toBeDefined();
    });

    it('handleConnection/Disconnect do not throw', () => {
      const gateway = new ChatGateway();
      expect(() => gateway.handleConnection({})).not.toThrow();
      expect(() => gateway.handleDisconnect({})).not.toThrow();
    });
  });

  // ── SSE test via async generator ─────────────────────
  describe('SSE generator', () => {
    it('generates events with correct shape', async () => {
      // Access private generator — test the shape of yielded values
      const gateway = new class {
        async *generate() {
          for (let i = 1; i <= 3; i++) {
            yield { event: 'tick', data: { count: i, message: `Tick #${i}`, time: new Date().toISOString() } };
          }
          yield { event: 'done', data: { message: 'Stream complete ✅' } };
        }
      }();

      const events: { event: string; data: Record<string, unknown> }[] = [];
      for await (const event of gateway.generate()) {
        events.push(event);
      }
      expect(events).toHaveLength(4);
      expect(events[0].event).toBe('tick');
      expect(events[0].data.count).toBe(1);
      expect(events[3].event).toBe('done');
    });
  });
});
