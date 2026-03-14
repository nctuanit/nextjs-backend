import { describe, expect, it, beforeAll, afterAll } from 'bun:test';
import { ElysiaFactory, Module, WebSocketGateway, SubscribeMessage, Injectable } from '../../index';

@WebSocketGateway({ path: '/chat', namespace: 'v1' })
class ChatGateway {
  handleConnection(ws: any) {
    ws.send(JSON.stringify({ event: 'connected', data: 'Welcome!' }));
  }

  handleDisconnect(ws: any) {
    // Teardown logic
  }

  @SubscribeMessage('ping')
  handlePing(data: any, ws: any) {
    return JSON.stringify({ event: 'pong', data: data || 'PONG' });
  }

  @SubscribeMessage('async_message')
  async handleAsync(data: any) {
    await new Promise(r => setTimeout(r, 50));
    return JSON.stringify({ event: 'async_reply', data: `Processed: ${data}` });
  }
}

@Module({
  providers: [ChatGateway]
})
class WsAppModule {}

describe('WebSockets Gateway & @SubscribeMessage', () => {
  let app: Awaited<ReturnType<typeof ElysiaFactory.create>>;
  let port: number;

  beforeAll(async () => {
    app = await ElysiaFactory.create(WsAppModule);
    // Bind to a random port to start listening to real ws connections
    app.listen(0);
    port = app.server?.port || 3000;
  });

  afterAll(() => {
    app.stop();
  });

  it('should connect to WebSocket and trigger handleConnection', async () => {
    const ws = new WebSocket(`ws://localhost:${port}/v1/chat`);
    
    const message = await new Promise((resolve, reject) => {
      ws.onmessage = (event) => resolve(JSON.parse(event.data));
      ws.onerror = (e) => reject(e);
      // Fail safe timeout
      setTimeout(() => reject(new Error('Timeout')), 1000);
    });

    expect(message).toEqual({ event: 'connected', data: 'Welcome!' });
    ws.close();
  });

  it('should trigger @SubscribeMessage and return response', async () => {
    const ws = new WebSocket(`ws://localhost:${port}/v1/chat`);
    
    // Ignore the welcome message
    let count = 0;
    const message = await new Promise((resolve, reject) => {
      ws.onopen = () => {
        ws.send(JSON.stringify({ event: 'ping', data: 'Hello from client' }));
      };
      
      ws.onmessage = (event) => {
        count++;
        if (count === 2) { // 1st is connected, 2nd is pong
          resolve(JSON.parse(event.data));
        }
      };
      ws.onerror = (e) => reject(e);
    });

    expect(message).toEqual({ event: 'pong', data: 'Hello from client' });
    ws.close();
  });

  it('should handle async @SubscribeMessage correctly', async () => {
    const ws = new WebSocket(`ws://localhost:${port}/v1/chat`);
    
    let count = 0;
    const message = await new Promise((resolve, reject) => {
      ws.onopen = () => {
        ws.send(JSON.stringify({ event: 'async_message', data: 'Bun is fast' }));
      };
      
      ws.onmessage = (event) => {
        count++;
        if (count === 2) {
          resolve(JSON.parse(event.data));
        }
      };
      ws.onerror = (e) => reject(e);
    });

    expect(message).toEqual({ event: 'async_reply', data: 'Processed: Bun is fast' });
    ws.close();
  });
});
