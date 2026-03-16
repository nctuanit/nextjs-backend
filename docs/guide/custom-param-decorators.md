# Custom Param Decorators

Create your own parameter decorators — identical to NestJS's `createParamDecorator`. This lets you extract any value from the Elysia context and inject it directly into controller method parameters.

## createParamDecorator

```typescript
import { createParamDecorator } from 'next-js-backend';
import type { Context } from 'elysia';

export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: Context) => {
    const user = (ctx as any).user; // set by AuthGuard
    return data ? user?.[data] : user;
  },
);
```

### Generic Typing

`createParamDecorator` is fully typed:

```typescript
createParamDecorator<TData, TOutput>(
  factory: (data: TData | undefined, ctx: Context) => TOutput | Promise<TOutput>
): (data?: TData) => ParameterDecorator
```

## Usage in Controllers

```typescript
import { Controller, Get } from 'next-js-backend';
import { CurrentUser } from './decorators/current-user.decorator';

@Controller('/users')
export class UserController {
  // Injects entire user object
  @Get('/me')
  getMe(@CurrentUser() user: User) {
    return user;
  }

  // Injects a specific field from user
  @Get('/email')
  getEmail(@CurrentUser('email') email: string) {
    return { email };
  }
}
```

## More Examples

### Extract Client IP

```typescript
export const ClientIp = createParamDecorator(
  (_data: unknown, ctx: Context) =>
    ctx.request.headers.get('x-forwarded-for') ??
    ctx.request.headers.get('host') ??
    'unknown'
);
```

### Extract Bearer Token

```typescript
export const BearerToken = createParamDecorator(
  (_data: unknown, ctx: Context) => {
    const auth = ctx.request.headers.get('authorization') ?? '';
    return auth.startsWith('Bearer ') ? auth.slice(7) : null;
  }
);
```

### Async Factory

The factory can be `async` — it will be awaited before the controller method runs:

```typescript
export const SessionUser = createParamDecorator(
  async (_data: unknown, ctx: Context) => {
    const token = ctx.request.headers.get('authorization');
    if (!token) return null;
    return await authService.validateToken(token);
  }
);
```

## How It Works

`createParamDecorator` stores the factory function in route metadata using `reflect-metadata`. When a request arrives, `ElysiaFactory` calls `factory(customData, ctx)` for each `CUSTOM` param before invoking the controller method.
