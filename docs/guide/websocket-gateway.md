# WebSocket Gateway

Next.js Backend supports WebSocket communication through the `@WebSocketGateway` decorator, providing a NestJS-compatible gateway pattern powered by Elysia's native WebSocket.

## Creating a Gateway

```typescript
import {
  WebSocketGateway,
  OnMessage,
  OnOpen,
  OnClose,
  WebSocketServer,
  type WsContext,
} from 'next-js-backend';

@WebSocketGateway('/chat')
export class ChatGateway {
  @OnOpen()
  onOpen(ctx: WsContext) {
    console.log('Client connected:', ctx.id);
    ctx.send(JSON.stringify({ event: 'welcome', data: 'Connected!' }));
  }

  @OnMessage()
  onMessage(ctx: WsContext, message: string | Buffer) {
    const data = JSON.parse(message.toString());
    console.log('Received:', data);

    // Echo back
    ctx.send(JSON.stringify({ event: 'echo', data }));
  }

  @OnClose()
  onClose(ctx: WsContext) {
    console.log('Client disconnected:', ctx.id);
  }
}
```

## Registering the Gateway

Add to your module's providers:

```typescript
@Module({
  providers: [ChatGateway],
})
export class ChatModule {}
```

## Rooms / Broadcasting

```typescript
@WebSocketGateway('/chat')
export class ChatGateway {
  private rooms = new Map<string, Set<WsContext>>();

  @OnMessage()
  onMessage(ctx: WsContext, message: string) {
    const { event, room, data } = JSON.parse(message);

    if (event === 'join') {
      if (!this.rooms.has(room)) this.rooms.set(room, new Set());
      this.rooms.get(room)!.add(ctx);
    }

    if (event === 'broadcast') {
      const roomClients = this.rooms.get(room) ?? new Set();
      for (const client of roomClients) {
        client.send(JSON.stringify({ event: 'message', data }));
      }
    }
  }

  @OnClose()
  onClose(ctx: WsContext) {
    // Remove from all rooms
    for (const clients of this.rooms.values()) {
      clients.delete(ctx);
    }
  }
}
```

## Client Connection

```javascript
const ws = new WebSocket('ws://localhost:3000/chat');

ws.onopen = () => {
  ws.send(JSON.stringify({ event: 'join', room: 'general' }));
};

ws.onmessage = ({ data }) => {
  console.log(JSON.parse(data));
};
```
