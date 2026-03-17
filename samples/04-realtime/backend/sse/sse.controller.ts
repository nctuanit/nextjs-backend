import 'reflect-metadata';
import { Controller, Get, Sse } from 'next-js-backend';
import { OnEvent, EventEmitterService } from 'next-js-backend';
import { Injectable, Logger } from 'next-js-backend';

/** POST /api/sse/publish?msg=hello — fires a server event */
@Controller('/sse')
export class SseController {
  constructor(private readonly emitter: EventEmitterService) {}

  /**
   * GET /api/sse/stream
   * Streams one event per second for 15 seconds via @Sse AsyncGenerator
   */
  @Sse('/stream')
  stream() {
    return this.generate();
  }

  private async *generate() {
    for (let i = 1; i <= 15; i++) {
      yield { event: 'tick', data: { count: i, message: `Server tick #${i}`, time: new Date().toISOString() } };
      await new Promise(r => setTimeout(r, 1000));
    }
    yield { event: 'done', data: { message: 'Stream complete ✅' } };
  }

  /** GET /api/sse/event — emits an event via EventEmitterService */
  @Get('/emit')
  emit() {
    this.emitter.emit('app.custom', { message: 'Event emitted!', at: new Date().toISOString() });
    return { emitted: true };
  }
}

/** Demonstrates @OnEvent listener reacting to emitted events */
@Injectable()
export class SseEventListener {
  private log: { at: string; message: string }[] = [];

  @OnEvent('app.custom')
  onCustomEvent(payload: { message: string; at: string }) {
    this.log.push(payload);
    Logger.log('[OnEvent] app.custom received: ' + JSON.stringify(payload));
  }

  getLog() { return [...this.log].reverse(); }
}
