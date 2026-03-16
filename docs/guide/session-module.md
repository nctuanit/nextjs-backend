# Session Module

The `SessionModule` provides cookie-based session management with pluggable storage backends.

## Setup

```typescript
import { Module, SessionModule } from 'next-js-backend';

@Module({
  imports: [
    SessionModule.register({
      secret: process.env.SESSION_SECRET!,
      cookieName: 'sid',
      ttl: 86400,        // 24 hours
      // store: new RedisSessionStore(...), // optional
    }),
  ],
})
export class AppModule {}
```

## Reading Sessions

Use `@Session()` in controllers:

```typescript
import { Session } from 'next-js-backend';

@Controller('/auth')
export class AuthController {
  constructor(private readonly sessionService: SessionService) {}

  @Post('/login')
  async login(@Body() dto: LoginDto, @Session() session: any) {
    const user = await this.authService.validate(dto);
    
    // Save to session
    await this.sessionService.setSession(session.id, { userId: user.id, role: user.role });
    
    return { message: 'Logged in' };
  }

  @Get('/me')
  async me(@Session() session: Record<string, unknown>) {
    return session; // { userId: 'u_123', role: 'admin' }
  }

  @Post('/logout')
  async logout(@Session() session: any) {
    await this.sessionService.destroy(session.id);
    return { message: 'Logged out' };
  }
}
```

## Session Store

### InMemory (default)

```typescript
SessionModule.register({
  secret: 'secret',
  // store not provided → uses InMemorySessionStore
})
```

Periodically purges expired sessions every 60 seconds.

### Redis

```typescript
import { RedisSessionStore } from 'next-js-backend';

SessionModule.register({
  secret: process.env.SESSION_SECRET!,
  store: new RedisSessionStore({ client: redisClient }),
})
```

### Custom Store

Implement `SessionStore`:

```typescript
import { SessionStore } from 'next-js-backend';

export class PrismaSessionStore extends SessionStore {
  async get(sessionId: string) { ... }
  async set(sessionId: string, data, ttl) { ... }
  async destroy(sessionId: string) { ... }
  async touch(sessionId: string, ttl) { ... }
}
```

## Configuration Options

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `secret` | `string` | ✅ | Secret for cookie signing |
| `cookieName` | `string` | — | Cookie name (default: `'sid'`) |
| `ttl` | `number` | — | Session TTL in seconds (default: 86400) |
| `store` | `SessionStore` | — | Custom storage backend |
| `secure` | `boolean` | — | HTTPS-only cookie |
| `httpOnly` | `boolean` | — | Prevent JS access |
