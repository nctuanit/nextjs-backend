# Rate Limiting & Throttle

Protect your API from abuse with built-in rate limiting via `@Throttle` and `@RateLimit` decorators.

## Setup

```typescript
import { Module } from 'next-js-backend';

@Module({
  // Rate limiting is enabled per-route via decorators, no global module setup needed
})
export class AppModule {}
```

## @Throttle Decorator

Apply a request rate limit per route:

```typescript
import { Throttle } from 'next-js-backend';

@Controller('/auth')
export class AuthController {
  // Max 5 login attempts per minute per IP
  @Post('/login')
  @Throttle({ limit: 5, window: 60 })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  // Max 3 password reset requests per hour
  @Post('/forgot-password')
  @Throttle({ limit: 3, window: 3600 })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }
}
```

## @RateLimit Decorator

```typescript
import { RateLimit } from 'next-js-backend';

@Controller('/api')
export class ApiController {
  @Get('/data')
  @RateLimit({ max: 100, duration: 60 }) // 100 req/min
  getData() {
    return this.service.getData();
  }
}
```

## Rate Limit Options

| Option | Type | Description |
|--------|------|-------------|
| `limit` / `max` | `number` | Max requests allowed |
| `window` / `duration` | `number` | Time window in seconds |
| `keyBy` | `string` | Key strategy: `'ip'` (default), `'user'` |

## Rate Limit Headers

When rate limiting is active, the following headers are returned:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1710585600
```

When limit is exceeded:

```
HTTP 429 Too Many Requests
Retry-After: 60
```

## Controller-level Throttle

```typescript
@Controller('/ai')
@Throttle({ limit: 20, window: 60 }) // Applied to all AI routes
export class AiController {
  @Post('/chat')  // Inherits controller limit
  chat() {}

  @Post('/expensive')
  @Throttle({ limit: 5, window: 60 }) // Override for heavy endpoints
  expensiveOperation() {}
}
```
