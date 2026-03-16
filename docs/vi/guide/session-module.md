# Session Module

Cookie-based session — lưu dữ liệu phiên người dùng mà không cần client gửi token mỗi request.

## Cài Đặt

```typescript
@Module({
  imports: [
    SessionModule.register({
      secret: process.env.SESSION_SECRET!,
      cookieName: 'sid',
      ttl: 86400,        // 24 giờ
    }),
  ],
})
export class AppModule {}
```

## Đọc/Ghi Session Trong Controller

```typescript
@Controller('/auth')
export class AuthController {
  constructor(private readonly sessionService: SessionService) {}

  @Post('/login')
  async login(@Body() dto: LoginDto, @Session() session: any) {
    const user = await this.authService.validate(dto);
    
    // Lưu vào session
    await this.sessionService.setSession(session.id, { userId: user.id, role: user.role });
    
    return { message: 'Đăng nhập thành công' };
  }

  @Get('/me')
  async me(@Session() session: Record<string, unknown>) {
    return session; // { userId: 'u_123', role: 'admin' }
  }

  @Post('/logout')
  async logout(@Session() session: any) {
    await this.sessionService.destroy(session.id);
    return { message: 'Đã đăng xuất' };
  }
}
```

## Backends Lưu Session

### InMemory (Mặc Định) — Dùng Cho Dev

```typescript
SessionModule.register({ secret: 'secret' })
// Tự động dọn session hết hạn mỗi 60 giây
```

Mất khi restart server — không dùng cho production.

### Redis — Dùng Cho Production

```typescript
import { RedisSessionStore } from 'next-js-backend';

SessionModule.register({
  secret: process.env.SESSION_SECRET!,
  store: new RedisSessionStore({ client: redisClient }),
})
```

### Tự Viết Store

```typescript
import { SessionStore } from 'next-js-backend';

export class PrismaSessionStore extends SessionStore {
  async get(sessionId: string) { ... }
  async set(sessionId: string, data, ttl) { ... }
  async destroy(sessionId: string) { ... }
}
```

## Các Tùy Chọn

| Tùy chọn | Ý nghĩa | Mặc định |
|----------|---------|---------|
| `secret` | Key ký cookie | Bắt buộc |
| `cookieName` | Tên cookie | `'sid'` |
| `ttl` | Thời gian sống (giây) | `86400` |
| `secure` | Chỉ gửi qua HTTPS | `false` |
| `httpOnly` | JS không đọc được cookie | `true` |
| `store` | Backend lưu session | InMemory |
