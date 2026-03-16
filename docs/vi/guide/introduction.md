# Giới Thiệu

**Next.js Backend** là thư viện giúp bạn xây dựng backend trong Next.js theo cách sạch sẽ, có cấu trúc rõ ràng — không còn kiểu "nhét API route bừa vào rồi sau này khóc".

Ý tưởng xuất phát từ một vấn đề thực tế: viết API trực tiếp trong Next.js (Route Handlers / API Routes) rất nhanh ban đầu, nhưng khi project lớn dần lên thì code bắt đầu loạn. Không có DI, không có middleware chuẩn, không có cách tổ chức rõ ràng — maintain khổ, onboard người mới còn khổ hơn.

**Next.js Backend** giải quyết đúng vấn đề đó — mang kiến trúc của NestJS (Decorators, DI, Modules) vào thẳng Next.js App Router, kết hợp với nhân ElysiaJS/Bun để đảm bảo hiệu năng không kém ai.

## Tại Sao Lại Cần Cái Này?

JavaScript đã chiếm lĩnh cả frontend lẫn backend. Nhưng phần lớn backend framework JS đều thiếu một thứ quan trọng: **kiến trúc phần mềm nghiêm túc**.

Thư viện này lấy cảm hứng từ Angular và NestJS — hai framework nổi tiếng với kiến trúc vững:

- **Loosely coupled** — mỗi module độc lập, test riêng được, không ảnh hưởng nhau
- **Dependency Injection** — không global state lộn xộn, chỉ là IoC container sạch
- **Convention over configuration** — decorator quen thuộc, cấu trúc dự đoán được

## Những Gì Bạn Có Ngay Từ Hộp

| Tính năng | Ghi chú |
|-----------|---------|
| `@Controller`, `@Module`, `@Injectable` | Giống NestJS, không cần học lại |
| `@Guard`, `@Interceptor`, `@Pipe` | Pipeline đầy đủ |
| `@UseMiddleware`, `@Throttle` | Middleware & rate limiting |
| `AiModule` | Multi-provider agents, tools, memory, workflow |
| `ScheduleModule` | Cron job với `@Cron` |
| `EventEmitterModule` | Pub/sub với `@OnEvent` |
| `SessionModule` | Session dựa trên cookie |
| `CacheModule` | Cache response có TTL |
| `JwtModule`, `NextAuthModule` | Authentication |
| `WebSocketGateway`, `@Sse` | Realtime |
| `createParamDecorator` | Tự tạo decorator lấy param |
| OpenAPI / Swagger | Tài liệu API tự sinh |

## Bên Dưới Hood

Tầng mạng dùng ElysiaJS — một trong những HTTP framework nhanh nhất hiện tại. Bên trên đó, `next-js-backend` đặt một lớp kiến trúc chuẩn để code của bạn không biến thành mớ hỗn độn theo thời gian.

Bạn vẫn dùng được toàn bộ plugin của Elysia (Swagger, JWT, WebSocket...) trong khi code vẫn giữ được "enterprise-ready structure".

## Cài Đặt

::: code-group

```bash [npm]
npm install next-js-backend elysia reflect-metadata
```

```bash [bun]
bun add next-js-backend elysia reflect-metadata
```

:::

## Chạy Thử Nhanh

```typescript
import 'reflect-metadata';
import { ElysiaFactory } from 'next-js-backend';
import { AppModule } from './app.module';

const app = await ElysiaFactory.create(AppModule);
app.listen(3000);
console.log('Server đang chạy tại http://localhost:3000 🚀');
```
