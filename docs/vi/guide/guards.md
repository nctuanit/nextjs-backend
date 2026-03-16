# Guards — Kiểm Tra Quyền Truy Cập

Guard quyết định request có được đi tiếp hay bị chặn lại. Dùng cho **authorization** — không phải authentication (đó là việc của JWT/NextAuth), mà là kiểm tra người này _có được phép_ làm điều này không.

## Tạo Guard

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
      context.user = payload; // đính user vào context để handler dùng
      return true;
    } catch {
      return false; // token sai hoặc hết hạn → trả 403
    }
  }
}
```

Trả về `false` → framework tự trả `403 Forbidden`, không cần xử lý thêm.

## Gắn Vào Route

### Cho một endpoint cụ thể

```typescript
@Get('/profile')
@UseGuards(AuthGuard)
getProfile(@CurrentUser() user: User) {
  return user;
}
```

### Cho cả controller

```typescript
@Controller("/admin")
@UseGuards(AuthGuard, RolesGuard)
export class AdminController {
  // tất cả routes trong này đều bị chặn nếu không pass guard
}
```

## Guard Theo Role

```typescript
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

## Guards Có Sẵn

```typescript
// JWT — kiểm tra Bearer token trong Authorization header
@UseGuards(JwtAuthGuard)

// NextAuth — kiểm tra session cookie từ Auth.js
@UseGuards(NextAuthGuard)
```

## Thứ Tự Chạy

Guards chạy **trước** interceptors và handler:

```
Request → Middleware → Guards → Interceptors → Handler → Response
```

Nhiều guard thì chạy theo thứ tự khai báo — nếu guard đầu fail thì guard sau không chạy.
