<p align="center">
  <img src="docs/src/assets/logo.png" width="300" alt="Next.js Backend Logo" />
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/next-js-backend"><img src="https://img.shields.io/npm/v/next-js-backend.svg?style=flat-square" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/next-js-backend"><img src="https://img.shields.io/npm/dm/next-js-backend.svg?style=flat-square" alt="npm downloads" /></a>
  <a href="https://github.com/nctuanit/nextjs-backend/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/next-js-backend.svg?style=flat-square" alt="license" /></a>
  <img src="https://img.shields.io/badge/runtime-Bun%20%7C%20Node.js%20%E2%89%A520-f9a8d4?style=flat-square" alt="runtime" />
  <img src="https://img.shields.io/badge/tests-86%20passed-brightgreen?style=flat-square" alt="tests" />
</p>

# next-js-backend

A **NestJS-style** backend framework for **Bun** and **Node.js ≥ 20**, built on top of [ElysiaJS](https://elysiajs.com/). It provides decorator-based routing, a hierarchical Dependency Injection container, request pipeline (Guards, Interceptors, Pipes, Exception Filters), and first-class integration with the Next.js App Router.

## Installation

```bash
# Bun
bun add next-js-backend

# npm
npm install next-js-backend

# pnpm
pnpm add next-js-backend
```

## Runtime Compatibility

| Feature | Bun | Node.js ≥ 20 |
|---------|:---:|:---:|
| Core framework | ✅ | ✅ |
| Password hashing | `Bun.password` (native) | `bcryptjs` / `argon2` (auto-detected) |
| Response compression | `Bun.gzipSync` / `deflateSync` | `node:zlib` built-in (auto-detected) |
| WebSocket Gateway | ✅ | ✅ |
| SSE Streaming | ✅ | ✅ |

> **Runtime detection** is automatic — no configuration required. On Bun, native APIs are used for maximum performance. On Node.js, the framework falls back to equivalent npm packages and built-in modules transparently.

---

## Requirements

The framework relies on the **TC39 Stage 3 Decorators** proposal via TypeScript's legacy decorator implementation (required for `reflect-metadata`). Add the following flags to `tsconfig.json`:

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

---

## Feature Overview

| Category | Capabilities |
|----------|-------------|
| **Architecture** | `@Module`, `@Controller`, `@Injectable`, hierarchical DI container |
| **Routing** | `@Get` / `@Post` / `@Put` / `@Patch` / `@Delete`, URI versioning, global prefix |
| **Parameter Extraction** | `@Body`, `@Param`, `@Query`, `@Headers`, `@Req`, `@Res`, `@Session`, `@File`, `@Files` |
| **Request Pipeline** | `@UseGuards`, `@UseInterceptors`, `@UsePipes`, `@UseFilters`, `@UseMiddleware` |
| **Auth** | `JwtModule`, `AuthGuard`, `PasswordService`, `SessionModule`, NextAuth (Auth.js v5) |
| **Throttle** | `@Throttle`, `@RateLimit` per-route and per-controller |
| **Config** | `ConfigModule.forRoot()` with TypeBox schema validation against `process.env` |
| **Cache** | `CacheModule`, `CacheInterceptor`, `@CacheKey`, `@CacheTTL` |
| **Realtime** | `@WebSocketGateway`, `@SubscribeMessage`, SSE via `@Sse`, `@OnEvent` pub/sub |
| **Scheduling** | `@Cron` via [croner](https://github.com/Hexagon/croner) |
| **DX** | `DevModeModule` request profiler, `HealthModule`, OpenAPI/Swagger, Eden Treaty codegen |
| **Tooling** | CLI scaffolding (`npx next-js-backend new`), `Test.createTestingModule()` |

---

## Core Concepts

### 1. Controllers & Routing

Controllers handle incoming HTTP requests and return responses. HTTP method decorators (`@Get`, `@Post`, etc.) define route handlers; parameter decorators extract data from the request context.

```typescript
import { Controller, Get, Post, Body, Param, Query, Headers } from 'next-js-backend';

@Controller('/users')
export class UsersController {
  @Get()
  findAll(@Query('role') role?: string) {
    return [{ id: 1, name: 'Alice', role: role ?? 'user' }];
  }

  @Get('/:id')
  findOne(
    @Param('id') id: string,
    @Headers('authorization') token: string,
  ) {
    return { id, authenticated: !!token };
  }

  @Post()
  create(@Body() dto: CreateUserDto) {
    return { created: true, data: dto };
  }
}
```

### 2. Dependency Injection

Classes decorated with `@Injectable()` are registered in the DI container and can be injected via constructor parameters. The container resolves the full dependency graph automatically.

```typescript
import { Injectable, Controller, Get } from 'next-js-backend';

@Injectable()
export class UsersService {
  findAll() {
    return ['Alice', 'Bob'];
  }
}

@Controller('/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll() {
    return this.usersService.findAll();
  }
}
```

### 3. Modules

All providers and controllers must be declared inside a `@Module`. Modules can import other modules, making their exported providers available to the importing context.

```typescript
import { Module } from 'next-js-backend';

@Module({
  imports: [ConfigModule, JwtModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
```

### 4. Validation

Two validation strategies are supported and can be mixed:

**TypeBox** (compile-time schema, zero-overhead runtime validation via Elysia):

```typescript
import { t } from 'elysia';
import { Body, Post, Controller, Schema } from 'next-js-backend';

@Controller('/users')
export class UsersController {
  @Post()
  @Schema({ body: t.Object({ name: t.String(), age: t.Number() }) })
  create(@Body() body: { name: string; age: number }) {
    return body;
  }
}
```

**class-validator** (decorator-based DTO validation, NestJS-compatible):

```typescript
import { IsString, IsEmail, MinLength } from 'class-validator';
import { Body, Post, Controller, UsePipes, ValidationPipe } from 'next-js-backend';

export class CreateUserDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsEmail()
  email: string;
}

@Controller('/users')
export class UsersController {
  @Post()
  @UsePipes(new ValidationPipe({ whitelist: true }))
  create(@Body() dto: CreateUserDto) {
    return dto;
  }
}
```

### 5. Guards

Guards implement the `CanActivate` interface and run before the route handler. They have access to the full Elysia `Context` and must return `true` (allow) or `false` (deny, throws `ForbiddenException`).

```typescript
import { Injectable } from 'next-js-backend';
import type { CanActivate, Context } from 'next-js-backend';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: Context): Promise<boolean> {
    const token = context.request.headers.get('authorization')?.split(' ')[1];
    if (!token) return false;
    const payload = await this.jwtService.verify(token);
    return !!payload;
  }
}
```

Apply at controller or method level:

```typescript
@UseGuards(JwtAuthGuard)
@Controller('/admin')
export class AdminController { ... }
```

### 6. Interceptors

Interceptors wrap the route handler execution. They can mutate the incoming context, transform the response, or implement cross-cutting concerns (e.g., caching, logging).

```typescript
import { Injectable } from 'next-js-backend';
import type { NestInterceptor, Context } from 'next-js-backend';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  async intercept(context: Context, next: () => Promise<unknown>) {
    const start = performance.now();
    const result = await next();
    const ms = (performance.now() - start).toFixed(2);
    Logger.log(`[${context.request.method}] ${new URL(context.request.url).pathname} — ${ms}ms`);
    return result;
  }
}
```

### 7. Exception Filters

Exception filters catch errors thrown during request processing. Use `@Catch(ErrorType)` to scope a filter to specific error classes; an empty `@Catch()` catches all errors.

```typescript
import { Catch, ExceptionFilter, UseFilters, HttpException } from 'next-js-backend';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, context: any) {
    context.set.status = exception.getStatus();
    return {
      statusCode: exception.getStatus(),
      message: exception.message,
      timestamp: new Date().toISOString(),
    };
  }
}

// Apply globally via ElysiaFactory.create(AppModule, { globalFilters: [HttpExceptionFilter] })
// or per-controller / per-method:
@UseFilters(HttpExceptionFilter)
@Controller('/users')
export class UsersController { ... }
```

### 8. Bootstrapping

**Standalone server:**

```typescript
import { Module, ElysiaFactory } from 'next-js-backend';
import { UsersModule } from './users/users.module';

@Module({ imports: [UsersModule] })
class AppModule {}

async function bootstrap() {
  const app = await ElysiaFactory.create(AppModule, {
    globalPrefix: '/api',
  });
  app.listen(3000);
  Logger.log('Server listening on http://localhost:3000');
}
bootstrap();
```

**Next.js App Router** (`app/api/[...slug]/route.ts`):

```typescript
import { ElysiaFactory } from 'next-js-backend';
import { AppModule } from '@/server/app.module';

// ElysiaFactory.createNextJsHandlers() initialises the app once (singleton)
// and wraps it in Next.js-compatible route handler exports.
export const { GET, POST, PUT, PATCH, DELETE } =
  ElysiaFactory.createNextJsHandlers(AppModule, {
    globalPrefix: '/api',
  });
```

---

## Built-in Modules

### ConfigModule

Validates `process.env` against a TypeBox schema at startup and makes configuration available via `ConfigService`.

```typescript
import { ConfigModule, ConfigService } from 'next-js-backend';
import { t } from 'elysia';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      schema: t.Object({
        DATABASE_URL: t.String(),
        PORT: t.Numeric({ default: 3000 }),
        JWT_SECRET: t.String({ minLength: 32 }),
      }),
    }),
  ],
})
export class AppModule {}
```

### JwtModule & PasswordService

`PasswordService` automatically selects the hashing backend based on the detected runtime:

| Runtime | bcrypt | argon2 |
|---------|--------|--------|
| Bun | `Bun.password` (native) | `Bun.password` (native) |
| Node.js | `bcryptjs` | `argon2` npm package |

```typescript
import { JwtModule, PasswordService } from 'next-js-backend';

@Module({
  imports: [JwtModule.register({ secret: process.env.JWT_SECRET, expiresIn: '1h' })],
  providers: [PasswordService],
})
export class AuthModule {}

// Usage in a service:
const hash = await this.passwordService.hash('plaintext', { algorithm: 'argon2id' });
const valid = await this.passwordService.verify('plaintext', hash); // true
```

Supported algorithms: `'bcrypt'` (default) · `'argon2id'` · `'argon2d'` · `'argon2i'`

### SessionModule

Cookie-based session management with HMAC-signed session IDs.

```typescript
import { SessionModule } from 'next-js-backend';

SessionModule.register({
  secret: process.env.SESSION_SECRET, // used for HMAC signing
  cookieName: 'sid',
  ttl: 86400,  // seconds; default: 3600
})
```

Access the session in a controller:

```typescript
@Get('/me')
getProfile(@Session() session: SessionData) {
  return session ?? { error: 'Not authenticated' };
}
```

### CacheModule

In-memory LRU cache with optional TTL per endpoint. Integrates with `CacheInterceptor`.

```typescript
import { CacheModule, CacheInterceptor, CacheKey, CacheTTL } from 'next-js-backend';

CacheModule.register({ ttl: 60, max: 500 })

@Controller('/products')
@UseInterceptors(CacheInterceptor)
export class ProductsController {
  @Get()
  @CacheKey('all-products')
  @CacheTTL(120)
  findAll() { ... }
}
```

### CompressionModule

Response compression with runtime-appropriate implementation:

| Runtime | gzip / deflate | brotli |
|---------|---------------|--------|
| Bun | `Bun.gzipSync` / `Bun.deflateSync` | falls back to gzip |
| Node.js | `node:zlib.gzipSync` / `deflateSync` | `node:zlib.brotliCompressSync` |

```typescript
import { CompressionModule } from 'next-js-backend';

CompressionModule.register({
  encoding: 'gzip',   // 'gzip' | 'deflate' | 'br'
  threshold: 1024,    // minimum response size in bytes before compressing
  level: 6,           // compression level 0–9
})
```

### WebSocketGateway

Built on Elysia's native `app.ws()`. Message routing mirrors NestJS's `@SubscribeMessage` pattern.

```typescript
import { WebSocketGateway, SubscribeMessage, MessageBody, ConnectedSocket } from 'next-js-backend';

@WebSocketGateway({ path: '/ws' })
export class ChatGateway {
  @SubscribeMessage('message')
  handleMessage(
    @MessageBody() data: { text: string },
    @ConnectedSocket() client: WebSocket,
  ) {
    client.send(JSON.stringify({ event: 'reply', data }));
  }

  handleConnection(ws: WebSocket) { Logger.log('Client connected'); }
  handleDisconnect(ws: WebSocket) { Logger.log('Client disconnected'); }
}
```

### DevModeModule

In-process request profiler injected via Elysia's `onAfterResponse` lifecycle. Adds three diagnostic endpoints without requiring an external sidecar.

```typescript
DevModeModule.register({
  enabled: process.env.NODE_ENV !== 'production',
  maxHistory: 100,  // circular buffer size
})
```

Exposes:
- `GET /dev/history` — request log (method, path, status, latency, headers, body)
- `GET /dev/stats` — aggregate statistics (total requests, error rate, p50/p95 latency)
- `DELETE /dev/history` — clear the request buffer

---

## Global Type Augmentation

Extend the package's open interfaces to get full IDE type-safety for session data and auth user objects:

```typescript
// types/next-js-backend.d.ts
import 'next-js-backend';

declare module 'next-js-backend' {
  interface SessionData {
    userId: string;
    role: 'admin' | 'user';
  }

  interface User {
    id: number;
    email: string;
    isActive: boolean;
  }
}
```

After augmentation, `@Session() session` is typed as `SessionData`, enabling autocomplete for `session.userId`, `session.role`, etc.

---

## CLI

```bash
# Scaffold a new project
npx next-js-backend new my-api

# Generate application artifacts
npx next-js-backend g resource users     # module + controller + service
npx next-js-backend g controller posts
npx next-js-backend g service auth
npx next-js-backend g guard jwt
npx next-js-backend g interceptor logging
```

---

## Testing

The framework ships a `Test` utility for building isolated testing modules with provider overrides:

```typescript
import { Test, TestRequestBuilder } from 'next-js-backend';

const moduleRef = await Test.createTestingModule({
  controllers: [UsersController],
  providers: [UsersService],
})
  .overrideProvider(UsersService)
  .useValue({ findAll: () => [{ id: 1, name: 'Alice' }] })
  .compile();

const app = await moduleRef.createApp();
const res = await app.handle(new TestRequestBuilder().path('/users').build());
expect(res.status).toBe(200);
```

```bash
bun test           # runs 86 tests / 228 assertions
bun run typecheck  # tsc --noEmit
```

---

## Eden Treaty — Type-Safe Client Codegen

Generate a fully typed client from your module's route definitions:

```bash
bun run eden:generate src/app.module.ts --output src/eden.ts --watch
```

```typescript
import { treaty } from '@elysiajs/eden';
import type { App } from './eden';

const api = treaty<App>('http://localhost:3000');

const { data: users } = await api.users.get();
const { data: user } = await api.users.post({ name: 'Alice', email: 'a@example.com' });
```

---

## Task Scheduling & Events

```typescript
@Injectable()
export class TasksService {
  // Standard cron expression (runs daily at midnight UTC)
  @Cron('0 0 * * *')
  async dailyCleanup() { ... }
}

@Injectable()
export class NotifyService {
  @OnEvent('user.created')
  async sendWelcomeEmail(payload: { email: string; name: string }) { ... }
}
```

---

## Comparison

| Feature | next-js-backend | NestJS | Hono |
|---------|:-:|:-:|:-:|
| Bun native | ✅ | ❌ | ✅ |
| Node.js ≥ 20 | ✅ | ✅ | ✅ |
| Decorators + DI | ✅ | ✅ | ❌ |
| Next.js App Router | ✅ | ❌ | ⚠️ |
| Type-safe client | ✅ Eden | ❌ | ❌ |
| Guards / Interceptors / Filters | ✅ | ✅ | ❌ |
| WebSocket | ✅ | ✅ | ❌ |
| CLI scaffolding | ✅ | ✅ | ❌ |
| Approx. bundle size | ~50 KB | ~2 MB | ~14 KB |

---

## License

MIT © 2026 Tuan Nguyen
