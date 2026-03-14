import { describe, test, expect } from 'bun:test';
import { Elysia } from 'elysia';
import 'reflect-metadata';

// Direct imports to avoid full index barrel
import { Controller } from '../../src/decorators/controller.decorator';
import { Injectable } from '../../src/di/injectable.decorator';
import { Module } from '../../src/decorators/module.decorator';
import { Sse } from '../../src/decorators/sse.decorator';
import { ElysiaFactory } from '../../src/factory/elysia-factory';

@Controller('/stream')
class StreamController {
  @Sse('/events')
  async *streamEvents() {
    yield { data: { message: 'hello' } };
    yield { data: { message: 'world' } };
  }

  @Sse('/simple')
  async *simpleStream() {
    yield 'ping';
    yield 'pong';
  }

  @Sse('/with-event')
  async *namedEvents() {
    yield { event: 'notification', data: { text: 'New message!' } };
  }
}

@Module({
  controllers: [StreamController],
})
class StreamModule {}

describe('SSE (Server-Sent Events)', () => {
  test('should stream data from async generator', async () => {
    const app = await ElysiaFactory.create(StreamModule);
    
    const response = await app.handle(new Request('http://localhost/stream/events'));
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('text/event-stream');
    
    const text = await response.text();
    expect(text).toContain('data: {"message":"hello"}');
    expect(text).toContain('data: {"message":"world"}');
  });

  test('should stream simple string data', async () => {
    const app = await ElysiaFactory.create(StreamModule);
    
    const response = await app.handle(new Request('http://localhost/stream/simple'));
    expect(response.status).toBe(200);
    
    const text = await response.text();
    expect(text).toContain('data: ping');
    expect(text).toContain('data: pong');
  });

  test('should support named events', async () => {
    const app = await ElysiaFactory.create(StreamModule);
    
    const response = await app.handle(new Request('http://localhost/stream/with-event'));
    expect(response.status).toBe(200);
    
    const text = await response.text();
    expect(text).toContain('event: notification');
    expect(text).toContain('data: {"text":"New message!"}');
  });
});
