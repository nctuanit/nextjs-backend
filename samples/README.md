# next-js-backend Samples

Each directory is a standalone **Next.js 14 App Router** project demonstrating a specific feature group of `next-js-backend`. All projects use a single catch-all API route (`app/api/[...slug]/route.ts`) delegating to `ElysiaFactory.createNextJsHandlers(AppModule)`.

## Projects

| Directory | Port | Features |
|-----------|------|---------|
| `01-crud-basics/` | 3001 | Controllers, DI, Modules, TypeBox, class-validator, URI Versioning v1/v2, Exception Filters |
| `02-request-pipeline/` | 3002 | Guards (CanActivate), Interceptors (NestInterceptor), Pipes (PipeTransform) |
| `03-auth/` | 3003 | JwtModule, AuthGuard, PasswordService (Bun.password / bcryptjs / argon2) |
| `04-realtime/` | 3004 | WebSocketGateway, @Sse AsyncGenerator, EventEmitterModule, @OnEvent |
| `05-modules/` | 3005 | CacheModule, CompressionModule, @Throttle, @RateLimit, HealthModule, DevModeModule |
| `06-background/` | 3006 | QueueModule, @Processor, @Process, ScheduleModule, @Cron, @OnEvent |
| `07-openapi-testing/` | 3007 | OpenAPI/Swagger via PluginsModule + @elysiajs/swagger, TypeBox schema docs |

## Running a Sample

```bash
cd samples/<project-name>
npm install
npm run dev
# Open http://localhost:<port>
```

## Structure per Project

```
<project>/
├── package.json            # next, next-js-backend (file:../..), elysia
├── tsconfig.json           # experimentalDecorators + emitDecoratorMetadata enabled
├── next.config.ts
├── app/
│   ├── layout.tsx
│   ├── page.tsx            # interactive demo page
│   └── api/[...slug]/route.ts   # catch-all → ElysiaFactory.createNextJsHandlers(AppModule)
└── backend/
    ├── app.module.ts
    └── <feature modules>
```
