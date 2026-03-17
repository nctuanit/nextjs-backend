import 'reflect-metadata';
import {
  WebSocketGateway,
  SubscribeMessage,
  Logger,
} from 'next-js-backend';

/**
 * ChatGateway — mounted at /ws
 * MessageBody and ConnectedSocket are NOT exported by next-js-backend.
 * The handler receives (data, client) as positional args from the framework.
 */
@WebSocketGateway({ path: '/ws' })
export class ChatGateway {
  handleConnection(_ws: unknown) {
    Logger.log('[ChatGateway] client connected');
  }

  handleDisconnect(_ws: unknown) {
    Logger.log('[ChatGateway] client disconnected');
  }

  @SubscribeMessage('message')
  handleMessage(data: { text: string }, client: { send: (v: string) => void }) {
    client.send(JSON.stringify({
      event: 'reply',
      data: { echo: data.text, server: 'ChatGateway', at: new Date().toISOString() },
    }));
  }

  @SubscribeMessage('ping')
  handlePing(_data: unknown, client: { send: (v: string) => void }) {
    client.send(JSON.stringify({ event: 'pong', data: { at: new Date().toISOString() } }));
  }
}
