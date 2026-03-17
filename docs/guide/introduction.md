# Introduction

**Next.js Backend** is a framework for **Bun** and **Node.js ≥ 20** designed to build flexible, high-performance, and scalable backend applications.

The core idea came from the **limitations** of writing APIs directly inside the Next.js ecosystem (API Routes / Route Handlers). The lack of a clear software architecture, Dependency Injection, and standard middleware flows made managing large-scale Next.js fullstack projects complex and hard to maintain.

**Next.js Backend** was born to solve this — bringing the full power and elegance of **NestJS architecture** (Decorators, Dependency Injection, Modules) but running directly inside Next.js App Router, combined with the ultra-fast core of **ElysiaJS / Bun**.

## Philosophy

JavaScript has become the most popular language for both frontend and backend. While there are many great libraries (Express, Fastify, Elysia), finding one that provides a **proper software architecture** is still a challenge.

This library provides a standard out-of-the-box architecture, inspired by the proven philosophies of Angular and NestJS:

- **Loosely coupled** — each module is independent and testable
- **Dependency Injection** — no global state, no singletons, just clean IoC
- **Convention over configuration** — familiar decorators, predictable structure

## Key Features

| Feature | Description |
|---------|-------------|
| `@Controller`, `@Module`, `@Injectable` | NestJS-style class decorators |
| `@Guard`, `@Interceptor`, `@Pipe` | Full request pipeline support |
| `@UseMiddleware`, `@Throttle` | Middleware and rate limiting |
| `AiModule` | Multi-provider AI agents with tools, memory, workflows |
| `ScheduleModule` | Cron jobs via `@Cron` |
| `EventEmitterModule` | Pub/sub via `@OnEvent` |
| `SessionModule` | Cookie-based sessions |
| `CacheModule` | Response caching with TTL |
| `JwtModule`, `NextAuthModule` | Authentication |
| `WebSocketGateway`, `@Sse` | Real-time communication |
| `createParamDecorator` | Custom parameter decorators |
| OpenAPI / Swagger | Auto-generated docs |

## Under the Hood

At the low level, the library uses ElysiaJS's high-speed HTTP engine for the network layer, while layering a solid software architecture on top.

This lets you leverage 100% of Elysia's rich plugin ecosystem (Swagger, JWT, WebSockets) while maintaining a production-grade code structure.

### Runtime Compatibility

The framework runs identically on both runtimes. Runtime-specific APIs are abstracted behind automatic detection:

| Subsystem | Bun | Node.js ≥ 20 |
|-----------|-----|-------------|
| HTTP server | Elysia on Bun | Elysia on Node.js |
| Password hashing | `Bun.password` (native) | `bcryptjs` / `argon2` |
| Response compression | `Bun.gzipSync` / `deflateSync` | `node:zlib` built-in |
| WebSocket | Bun native WS | WS via Elysia |
| All other APIs | Web-standard (`Request`, `Response`, `Headers`, `crypto`) | Same |

## Installation

::: code-group

```bash [npm]
npm install next-js-backend elysia reflect-metadata
```

```bash [bun]
bun add next-js-backend elysia reflect-metadata
```

:::

## Quick Example

```typescript
import 'reflect-metadata';
import { ElysiaFactory } from 'next-js-backend';
import { AppModule } from './app.module';

const app = await ElysiaFactory.create(AppModule);
app.listen(3000);
```
