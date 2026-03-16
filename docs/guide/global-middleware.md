# Global Middleware

Middleware functions execute before the route handler. They can modify the request/response or terminate the request early.

## Creating Middleware

Implement the `NestMiddleware` interface:

```typescript
import { Injectable, type NestMiddleware } from 'next-js-backend';
import { Middleware } from 'next-js-backend';

@Injectable()
@Middleware()
export class LoggerMiddleware implements NestMiddleware {
  async use(req: Request, res: unknown, next: () => void | Promise<void>) {
    const start = Date.now();
    const url = new URL(req.url).pathname;

    await next();

    console.log(`[${req.method}] ${url} ${Date.now() - start}ms`);
  }
}
```

## Registering Middleware

Add to the module's `providers` array:

```typescript
@Module({
  providers: [LoggerMiddleware],
})
export class AppModule {}
```

Or use `@UseMiddleware` on specific controllers/routes:

```typescript
import { UseMiddleware } from 'next-js-backend';

@Controller('/users')
@UseMiddleware(LoggerMiddleware)
export class UserController { ... }
```

## Body Parsing

Middleware can inspect the request body (note: body is cloned to preserve the stream):

```typescript
@Injectable()
@Middleware()
export class BodyLoggerMiddleware implements NestMiddleware {
  async use(req: Request, res: unknown, next: () => void | Promise<void>) {
    if (req.method !== 'GET') {
      const cloned = req.clone();
      const body = await cloned.json().catch(() => null);
      console.log('Request body:', body);
    }
    await next();
  }
}
```

## Request ID Middleware

```typescript
@Injectable()
@Middleware()
export class RequestIdMiddleware implements NestMiddleware {
  async use(req: Request, res: unknown, next: () => void | Promise<void>) {
    (req as any).id = crypto.randomUUID();
    await next();
  }
}
```

## Built-in: DevModeLoggerMiddleware

The `DevModeModule` automatically registers a profiling middleware that records request duration, status, headers, and body for the Dev Mode dashboard:

```typescript
@Module({
  imports: [
    DevModeModule.register({
      enabled: process.env.NODE_ENV !== 'production',
      maxHistory: 200,
    }),
  ],
})
export class AppModule {}
```

Then visit `GET /__dev/requests` for a JSON list of recent requests.
