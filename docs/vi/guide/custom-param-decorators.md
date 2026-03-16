# Custom Param Decorators

Muốn tự tạo decorator lấy dữ liệu từ request và inject thẳng vào param của controller? Dùng `createParamDecorator` — y chang cách NestJS làm.

## Tạo Decorator

```typescript
import { createParamDecorator } from "next-js-backend";
import type { Context } from "elysia";

export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: Context) => {
    const user = ctx.user; // AuthGuard đã gắn user vào context
    return data ? user?.[data] : user;
  },
);
```

## Dùng Trong Controller

```typescript
@Controller("/users")
export class UserController {
  // Lấy cả object user
  @Get("/me")
  getMe(@CurrentUser() user: User) {
    return user;
  }

  // Lấy một field cụ thể — data = 'email'
  @Get("/email")
  getEmail(@CurrentUser("email") email: string) {
    return { email };
  }
}
```

## Thêm Ví Dụ Hay Dùng

### Lấy IP Thực Của Client

```typescript
export const ClientIp = createParamDecorator(
  (_data: unknown, ctx: Context) =>
    ctx.request.headers.get("x-forwarded-for") ??
    ctx.request.headers.get("host") ??
    "unknown",
);
```

### Lấy Bearer Token

```typescript
export const BearerToken = createParamDecorator(
  (_data: unknown, ctx: Context) => {
    const auth = ctx.request.headers.get("authorization") ?? "";
    return auth.startsWith("Bearer ") ? auth.slice(7) : null;
  },
);
```

### Factory Async — Thoải Mái Dùng await

```typescript
export const SessionUser = createParamDecorator(
  async (_data: unknown, ctx: Context) => {
    const token = ctx.request.headers.get("authorization");
    if (!token) return null;
    return await authService.validateToken(token);
  },
);
```

Factory async thì được await tự động trước khi controller method chạy — không cần làm gì thêm.

## Hoạt Động Thế Nào?

`createParamDecorator` dùng `reflect-metadata` để lưu factory vào metadata của route. Khi request đến, `ElysiaFactory` gọi `factory(customData, ctx)` cho từng param `CUSTOM`, trước khi handler được gọi.

> **`data`** là giá trị bạn truyền vào lúc dùng decorator — ví dụ `@CurrentUser('email')` thì `data = 'email'`.
