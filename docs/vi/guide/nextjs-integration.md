# Tích Hợp Next.js

Gắn kết toàn bộ ứng dụng backend vào Route Handlers của Next.js App Router chỉ với một lệnh duy nhất.

## Thiết Lập

```typescript
// src/app/api/[...slug]/route.ts
import { ElysiaFactory } from 'next-js-backend';
import { AppModule } from '@/modules/app/app.module';

export const { GET, POST, PUT, PATCH, DELETE } =
  ElysiaFactory.createNextJsHandlers(AppModule, {
    globalPrefix: '/api',
  });
```

Chỉ vậy thôi. Tất cả routes đã đăng ký trong `AppModule` giờ có thể truy cập tại `/api/**`.

## Cách Hoạt Động

`ElysiaFactory.createNextJsHandlers` tạo một Elysia application singleton lười (lazy) được khởi tạo một lần duy nhất trong request đầu tiên, sau đó tái sử dụng cho tất cả các request tiếp theo (khớp với pattern của Next.js Route Handler).

## Tùy Chọn

```typescript
ElysiaFactory.createNextJsHandlers(AppModule, {
  globalPrefix: '/api',   // Prefix cho tất cả routes
  port: 3000,             // (chỉ cho standalone mode)
})
```

## CORS

Cấu hình CORS trong module của bạn:

```typescript
import cors from '@elysiajs/cors';

// Trong ElysiaFactory.create, mount plugin sau khi tạo app
const app = await ElysiaFactory.create(AppModule);
app.use(cors());
```
