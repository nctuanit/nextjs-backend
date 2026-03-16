# Next.js Integration

Mount a full backend application inside Next.js App Router's Route Handlers with a single call.

## Setup

```typescript
// src/app/api/[...slug]/route.ts
import { ElysiaFactory } from 'next-js-backend';
import { AppModule } from '@/modules/app/app.module';

export const { GET, POST, PUT, PATCH, DELETE } =
  ElysiaFactory.createNextJsHandlers(AppModule, {
    globalPrefix: '/api',
  });
```

That's it. All routes registered in `AppModule` are now accessible under `/api/**`.

## How It Works

`ElysiaFactory.createNextJsHandlers` creates a lazy singleton Elysia application that is initialized once on the first request, then reused for all subsequent requests (matching Next.js Route Handler patterns).

## Options

```typescript
ElysiaFactory.createNextJsHandlers(AppModule, {
  globalPrefix: '/api',   // Prefix for all routes
  port: 3000,             // (standalone only)
})
```

## CORS

Configure CORS in your module:

```typescript
import { Module } from 'next-js-backend';
import cors from '@elysiajs/cors';

@Module({
  imports: [...],
})
export class AppModule {
  configure(app: Elysia) {
    app.use(cors());
  }
}
```
