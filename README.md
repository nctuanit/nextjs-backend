<p align="center">
  <img src="docs/src/assets/logo.png" width="300" alt="Next.js Backend Logo" />
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/next-js-backend"><img src="https://img.shields.io/npm/v/next-js-backend.svg?style=flat-square" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/next-js-backend"><img src="https://img.shields.io/npm/dm/next-js-backend.svg?style=flat-square" alt="npm downloads" /></a>
  <a href="https://github.com/nctuanit/nextjs-backend/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/next-js-backend.svg?style=flat-square" alt="license" /></a>
  <img src="https://img.shields.io/badge/runtime-Bun-f9a8d4?style=flat-square" alt="runtime" />
  <img src="https://img.shields.io/badge/tests-86%20passed-brightgreen?style=flat-square" alt="tests" />
</p>

# Next.js Backend

A high-performance **NestJS-like** backend framework for **Bun**, powered by **ElysiaJS**. Write structured, decorator-based APIs with full DI, Guards, Interceptors, Pipes — and deploy to Next.js Edge, Vercel, or standalone.

```bash
bun add next-js-backend
```

## ✨ Feature Overview

| Category | Features |
|----------|----------|
| **Architecture** | `@Controller`, `@Injectable`, `@Module`, Dependency Injection |
| **Routing** | `@Get`, `@Post`, `@Put`, `@Delete`, `@Patch`, `@Param`, `@Body`, `@Query`, `@Headers` |
| **Pipeline** | Guards, Interceptors, Pipes, Exception Filters, Global Middleware, `@UseMiddleware` |
| **Auth** | JWT Module, NextAuth (Auth.js v5), Session Module, `@Throttle` rate limiting |
| **Data** | Cache Module, Config Module (env validation), `@Cron` scheduling |
| **Realtime** | WebSocket Gateway, SSE Streaming, `@OnEvent` pub/sub |
| **Tooling** | CLI (`npx next-js-backend new`), Testing Utilities, Eden Treaty codegen |
| **DX** | DevMode Profiler, Health Check Module, OpenAPI/Swagger, File Upload |

---

## 📦 Công Nghệ Sử Dụng (Tech Stack)

- **Runtime**: [Bun](https://bun.sh/)
- **Core Server**: [ElysiaJS](https://elysiajs.com/)
- **Validation**: [TypeBox](https://github.com/sinclairzx81/typebox) (Elysia gốc) & [class-validator](https://github.com/typestack/class-validator)
- **Metadata**: `reflect-metadata`

---

## 🛠️ Bắt Đầu Cài Đặt (Getting Started)

### Cài đặt thư viện

```bash
# Clone repository hoặc chạy lệnh này trong dự án của bạn
bun install next-js-backend
```

### Cấu hình TypeScript (Bắt buộc)

Thư viện này phụ thuộc hoàn toàn vào kỹ thuật **Decorators**. Bạn **bắt buộc** phải kích hoạt các cờ sau trong file `tsconfig.json` ở thư mục gốc của dự án:

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

### Chạy các Ứng Dụng Mẫu (Samples)

Chúng tôi cung cấp một số ứng dụng mẫu trong thư mục `samples/` để giúp bạn làm quen nhanh chóng:

```bash
# Mô hình Controller & DI Cơ bản
bun run start:basic

# Xác thực định dạng DTO với class-validator
bun run start:validation

# Luồng Guards và Interceptors
bun run start:guards

# Tài liệu OpenAPI Swagger (Chạy trên cổng 3003)
bun run start:swagger
```

---

## 📖 Các Khái Niệm Cốt Lõi (Core Concepts)

### 1. Controllers & Routing

Controller có trách nhiệm nhận các request đổ về và trả response cho phía client. Sử dụng các khai báo (decorators) điều hướng định tuyến (`@Get`, `@Post`, v.v.) và khai báo trích xuất thông tin tham số (`@Body`, `@Param`, `@Query`, `@Headers`, `@Req`, `@Res`, `@Session`, `@File`, `@Files`) để lấy dữ liệu gửi lên một cách dễ dàng.

```typescript
import { Controller, Get, Post, Body, Param, Query, Headers } from "next-js-backend";

@Controller("/users")
export class UsersController {
  @Get()
  getAllUsers(@Query('role') role?: string) {
    return [{ id: 1, name: "Alice", role: role || "user" }];
  }

  @Get('/:id')
  getUserById(@Param('id') userId: string, @Headers('authorization') token: string) {
    return { id: userId, tokenProvided: !!token };
  }

  @Post()
  createUser(@Body() body: any) {
    return { success: true, data: body };
  }
}
```

### 2. Dependency Injection (Tiêm Phụ Thuộc - Services)

Hãy gắn nhãn `@Injectable()` vào các hàm Service để chúng có thể được inject (tiêm thông qua constructor) vào trong Controllers hoặc các service chức năng khác.

```typescript
import { Injectable, Controller, Get } from "next-js-backend";

@Injectable()
export class UsersService {
  getUsers() {
    return ["Alice", "Bob"];
  }
}

@Controller("/users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  get() {
    return this.usersService.getUsers();
  }
}
```

### 3. Pipeline Xác Thực (Validation)

Bạn có thể tự do tiến hành validation định dạng dữ liệu đầu vào sử dụng **TypeBox** (Cách gốc của Elysia) hoặc **class-validator** (Cách tiêu chuẩn của NestJS).

**Sử Dụng Class Validator (Định dạng DTO):**

````typescript
import { IsString, IsEmail } from "class-validator";
import { Body, Post, Controller, UsePipes, ValidationPipe } from "next-js-backend";

class CreateUserDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;
}

@Controller("/users")
export class UsersController {
  @Post()
  @UsePipes(new ValidationPipe())
  create(@Body() dto: CreateUserDto) {
    return dto;
  }
}
```

### 4. Guards & Interceptors

**Guards** sẽ quét và xác định xem Request có quyền được đi tiếp vào Route Handler (tức các Controller) hay bị bắt dừng lại.
**Interceptors** có thể gắn bổ sung logic ở trước / và sau sự kiện thực thi Route Methods.

```typescript
import { CanActivate, Context, NextInterceptor } from "next-js-backend";

export class AuthGuard implements CanActivate {
  async canActivate(context: Context): Promise<boolean> {
    const token = context.request.headers.get("authorization");
    return token === "Bearer secret";
  }
}

export class LoggingInterceptor implements NextInterceptor {
  async intercept(context: Context, next: () => Promise<unknown>) {
    console.log("Before execution...");
    const result = await next();
    console.log("After execution...");
    return result;
  }
}
````

Sử dụng các lớp này trực tiếp bằng các `@Use` (decorators):

```typescript
@UseGuards(AuthGuard)
@UseInterceptors(LoggingInterceptor)
@Get('/secure')
getSecureData() { ... }
```

### 5. Exception Filters (Xử Lý Lỗi)

Giành quyền làm chủ toàn diện vòng đời Lỗi / Response. Bắt các ngoại lệ `Error` đột xuất trực tiếp trên cấp bậc Route hoàn toàn giống hệt NextJS.

```typescript
import {
  Catch,
  ExceptionFilter,
  UseFilters,
  Controller,
  Get,
} from "next-js-backend";

class CustomError extends Error {}

@Catch(CustomError) // Catch only CustomError
export class MyExceptionFilter implements ExceptionFilter {
  catch(exception: CustomError, context: any) {
    context.set.status = 503;
    return {
      message: "Internal Logic Overridden",
      errorDetails: exception.message,
    };
  }
}

@Controller("/users")
export class UsersController {
  @Get()
  @UseFilters(MyExceptionFilter)
  crash() {
    throw new CustomError("Oh no!");
  }
}
```

### 6. Bootstrapping & Tích Hợp Next.js App Router

Tổ hợp và gộp ứng dụng của bạn lại thông qua hệ thống `@Module` và khởi động (bootstrap) nó bằng hàm thư viện `ElysiaFactory`. Bạn có thể trích xuất ra một fetch handler tên là `app.handle` để gắn trực tiếp và chạy Native ngay lập tức trên các routes của Next.js Edge / API.

**Cho Môi trường Máy Chủ Độc Lập (Standalone JS Server):**

```typescript
import { Module, ElysiaFactory } from "next-js-backend";

@Module({
  controllers: [UsersController],
  providers: [UsersService],
})
class AppModule {}

async function bootstrap() {
  const app = await ElysiaFactory.create(AppModule);
  app.listen(3000, () => {
    console.log(`Server started on port 3000`);
  });
}
bootstrap();
```

**Cho Môi trường Next.js App Router (app/api/[...slug]/route.ts):**

```typescript
import { ElysiaFactory } from "next-js-backend";
import { AppModule } from "./app.module";

// Hàm hỗ trợ "createNextJsHandlers" giải quyết tự động Singleton Pattern
// và tối ưu Cold-Start cho ứng dụng Next.js Edge/Serverless.
export const { GET, POST, PUT, PATCH, DELETE } =
  ElysiaFactory.createNextJsHandlers(AppModule, {
    globalPrefix: "/api",
  });
```

### 7. Các Module Tích Hợp Sẵn (Enterprise Features)

Thư viện này cung cấp sẵn cho bạn các Modules nội bộ, tiện lợi và vô cùng bảo mật để chạy nhanh dự án khi bootstrap ứng dụng:

**ConfigModule (Xác thực thông số môi trường - Environment):**

```typescript
import { ConfigModule } from 'next-js-backend';
import { t } from 'elysia';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      schema: t.Object({
        DATABASE_URL: t.String(),
        PORT: t.Numeric({ default: 3000 }),
        JWT_SECRET: t.String()
      })
    })
  ]
})
```

**JwtModule, AuthGuard & PasswordService (Mã hóa mật khẩu):**

```typescript
import {
  JwtModule,
  AuthGuard,
  PasswordService,
  UseGuards,
  Controller,
  Get,
} from "next-js-backend";

@Module({
  imports: [JwtModule.register({ secret: "my-super-secret", expiresIn: "1h" })],
  providers: [PasswordService],
})
class AuthModule {}

@Controller("/profile")
@UseGuards(AuthGuard)
export class ProfileController {
  constructor(private password: PasswordService) {}

  @Get("/me")
  async getSecretData() {
    const hash = await this.password.hash("mypassword", {
      algorithm: "argon2id",
    });
    return { status: "Secure data", hash };
  }
}
```

**SessionModule (Giải pháp lưu trữ Cookie bảo mật cao):**

```typescript
import { SessionModule, Controller, Get, Session } from "next-js-backend";

@Module({
  imports: [
    SessionModule.register({
      secret: "super-secret", // Signs the Cookie
      cookieName: "sid",
      ttl: 86400, // 1 day expiration
    }),
  ],
})
class WebAppModule {}

@Controller("/profile")
export class ProfileController {
  @Get("/me")
  getProfile(@Session() session: SessionData) {
    return session || { message: "Not logged in via cookie!" };
  }
}
```

**Built-in LoggerService (Ghi Log Hệ Thống):**

```typescript
import { Logger } from "next-js-backend";

const logger = new Logger("MyContext");
logger.log("Standard log message");
logger.error("Error occurred", error.stack);
logger.warn("Warning log");
```

**CacheModule (Lưu trữ và phục hồi dữ liệu tốc độ cao):**

```typescript
import { CacheModule, Controller, Get, UseInterceptors, CacheInterceptor } from "next-js-backend";

@Module({
  imports: [
    CacheModule.register({ ttl: 60, max: 100 }) // ttl bằng giây
  ]
})
class AppModule {}

@Controller("/products")
@UseInterceptors(CacheInterceptor)
export class ProductsController {
  @Get()
  getProducts() {
    return { data: "This will be cached for 60 seconds" };
  }
}
```

**WebSocket Gateway (Giao tiếp Real-time):**

```typescript
import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket } from "next-js-backend";

@WebSocketGateway({ path: "/ws" })
export class ChatGateway {
  @WebSocketServer()
  server: any;

  @SubscribeMessage("message")
  handleMessage(@MessageBody() data: any, @ConnectedSocket() client: any) {
    // Phát sự kiện lại cho client
    client.send(JSON.stringify({ event: "reply", data }));
  }
}
```

**Global Middleware (Phần mềm trung gian toàn cục):**

```typescript
import { Middleware, NestMiddleware, MiddlewareConsumer } from "next-js-backend";

@Middleware()
export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: () => void) {
    console.log(`Incoming request: ${req.url}`);
    next();
  }
}

// Đăng ký Middleware trong Module
@Module({
  controllers: [/* ... */]
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
```

**DevMode Profiler (Thống kê và Cấu hình Môi trường Phát triển):**

Request Profiler được nhúng nguyên bản sử dụng `onAfterResponse` scope của Elysia, cho phép bạn quan sát toàn bộ độ trễ (latency), body, mã lỗi (status) mà hiệu năng Server bị sụt giảm cực kì thấp.

```typescript
import { DevModeModule, ElysiaFactory } from "next-js-backend";

@Module({
  imports: [
    DevModeModule.register({ 
       enabled: process.env.NODE_NODE !== 'production', // Chỉ kích hoạt khi dev
       maxHistory: 50 // Theo dõi 50 requests gần nhất
    })
  ]
})
export class AppModule {}

// Sau khi khởi chạy server, NextJs Backend sẽ mở sẵn các endpoint dưới đây:
// GET /dev/history  -> Lịch sử Requests (body, latency, status)
// GET /dev/stats    -> Tổng số Requests, tỉ lệ lỗi (Error Ratio)
// GET /dev/history/clear -> Xóa lịch sử
```

## 🌍 Mở Rộng Type Toàn Cục (Global Type Augmentation)

Để lấy được tối đa sự an toàn Typescript (Type safety) khi sử dụng các phương pháp lấy biến động `@Session()` hay xử lý trong custom Guards, thư viện bóc tách các Types chuẩn bị sẵn (mở) Global interfaces cho bạn can thiệp từ `.d.ts` (ví dụ, chèn code vào file `globals.d.ts` hoặc `next-env.d.ts` của repository bạn).

```typescript
// types.d.ts
import "next-js-backend";

declare module "next-js-backend" {
  interface SessionData {
    userId: string;
    role: "admin" | "user";
    preferences: { theme: string };
  }

  interface User {
    id: number;
    email: string;
    isActive: boolean;
  }
}
```

Và giờ đây, bất kì lúc nào bạn tiến hành dùng decorater `@Session() session`, Trình soạn thảo IDE của bạn đều sẽ gợi ý lệnh (auto-complete) rất hoàn hảo như thuộc tính `session.role` hay `session.userId`!

---

### 8. CLI Tool

Scaffold projects and generate code instantly:

```bash
# Tạo project mới
npx next-js-backend new my-api

# Sinh code
npx next-js-backend g resource users    # module + controller + service
npx next-js-backend g controller posts
npx next-js-backend g guard auth
```

### 9. Testing Utilities

```typescript
import { Test } from 'next-js-backend';

const module = await Test.createTestingModule({
  controllers: [UserController],
  providers: [UserService],
})
  .overrideProvider(UserService).useValue(mockService)
  .compile();

const app = await module.createApp();
const res = await app.handle(new Request('http://localhost/users'));
```

### 10. Eden Treaty — Type-Safe API Client

Auto-generate type-safe client from controllers:

```bash
bun run eden:generate src/app.module.ts --output src/eden.ts --watch
```

```typescript
import { treaty } from '@elysiajs/eden';
import type { App } from './eden';

const api = treaty<App>('http://localhost:3000');
const { data } = await api.users.get();     // ← full autocomplete
const { data: user } = await api.users.post({ name: 'Alice' }); // ← body enforced
```

### 11. Task Scheduling & Events

```typescript
@Injectable()
export class TasksService {
  @Cron('0 0 * * *')
  async dailyCleanup() { ... }
}

@Injectable()
export class NotifyService {
  @OnEvent('user.created')
  async sendWelcome(data: { email: string }) { ... }
}
```

### 12. Health Check

```typescript
@Module({ imports: [HealthModule] })
// GET /health → { status: 'ok', uptime, memory }
```

### 13. @Throttle & @UseMiddleware

```typescript
@Throttle({ limit: 5, ttl: 60 })  // 5 requests / 60s
@Get('/expensive')
compute() { ... }

@UseMiddleware(LoggingMiddleware)
@Get('/data')
getData() { ... }
```

---

## 📊 So Sánh (Comparison)

| Feature | next-js-backend | NestJS | Hono |
|---------|:-:|:-:|:-:|
| Bun native | ✅ | ❌ | ✅ |
| Decorators + DI | ✅ | ✅ | ❌ |
| Next.js Edge | ✅ | ❌ | ⚠️ |
| Type-safe client | ✅ Eden | ❌ | ❌ |
| Guards / Interceptors | ✅ | ✅ | ❌ |
| WebSocket | ✅ | ✅ | ❌ |
| CLI scaffolding | ✅ | ✅ | ❌ |
| Bundle size | ~50KB | ~2MB | ~14KB |

---

## 🧪 Testing

```bash
bun test           # 86 tests, 228 assertions
bun run typecheck  # tsc --noEmit
```

---

## 📜 Giấy Phép (License)

**MIT License**

Copyright (c) 2026 Tuan Nguyen

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
