# Guards

Guards determine whether a request should be handled by the route handler. They perform **authorization** — checking if the authenticated user has the right permissions.

## Creating a Guard

Implement the `CanActivate` interface:

```typescript
import { Injectable, type CanActivate } from "next-js-backend";
import type { Context } from "elysia";

@Injectable()
export class AuthGuard implements CanActivate {
  async canActivate(context: Context): Promise<boolean> {
    const token = context.request.headers.get("authorization")?.split(" ")[1];
    if (!token) return false;

    try {
      const payload = await verifyJwt(token);
      context.user = payload;
      return true;
    } catch {
      return false;
    }
  }
}
```

When `canActivate()` returns `false`, the framework throws a `403 Forbidden` response.

## Applying Guards

### Method-level

```typescript
import { UseGuards } from "next-js-backend";

@Controller("/users")
export class UserController {
  @Get("/profile")
  @UseGuards(AuthGuard)
  getProfile(@CurrentUser() user: User) {
    return user;
  }
}
```

### Controller-level

```typescript
@Controller("/admin")
@UseGuards(AuthGuard, RolesGuard)
export class AdminController {
  // All routes protected
}
```

### Global Guards

Register in your module via `ElysiaFactory`:

```typescript
const app = await ElysiaFactory.create(AppModule);
// Use Elysia middleware for global auth
```

## Role-based Guard

```typescript
import { Injectable, type CanActivate } from "next-js-backend";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly roles: string[]) {}

  async canActivate(context: Context): Promise<boolean> {
    const user = context.user;
    if (!user) return false;
    return this.roles.some((role) => user.roles?.includes(role));
  }
}
```

## Built-in Guards

### JwtAuthGuard

```typescript
import { JwtAuthGuard } from 'next-js-backend';

@Get('/protected')
@UseGuards(JwtAuthGuard)
getProtected(@CurrentUser() user: User) {
  return user;
}
```

### NextAuthGuard

```typescript
import { NextAuthGuard } from 'next-js-backend';

@Get('/me')
@UseGuards(NextAuthGuard)
getMe(@CurrentUser() session: Session) {
  return session.user;
}
```

## Guard Execution Order

Guards run **before** interceptors and handlers:

```
Request → Middleware → Guards → Interceptors → Handler → Response
```

If multiple guards are applied, they run in order. If any returns `false`, subsequent guards are not called.
