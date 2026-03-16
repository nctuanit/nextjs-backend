# Bắt Đầu Nào

## Yêu Cầu Trước

- **Bun** `>= 1.0` — [tải về tại đây](https://bun.sh)
- **TypeScript** `>= 5.0`

## Dùng CLI Cho Nhanh

Cách đơn giản nhất — để CLI lo hết:

```bash
npx next-js-backend new my-api
cd my-api
bun install
bun run dev
```

Ngon, server đang chạy tại `http://localhost:3000` 🚀

## Tự Cài Bằng Tay

Nếu bạn muốn tự kiểm soát từng bước:

### Bước 1 — Cài deps

```bash
bun add next-js-backend elysia reflect-metadata
bun add -d typescript @types/bun
```

### Bước 2 — Cấu hình TypeScript

Cần bật decorator metadata, không thì DI sẽ không hoạt động:

```json [tsconfig.json]
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "strict": true
  }
}
```

### Bước 3 — Viết code thôi

::: code-group

```typescript [src/main.ts]
import 'reflect-metadata';
import { ElysiaFactory } from 'next-js-backend';
import { AppModule } from './modules/app/app.module';

const app = await ElysiaFactory.create(AppModule);
app.listen(3000, () => {
  console.log('🚀 Chạy ngon tại http://localhost:3000');
});
```

```typescript [src/modules/app/app.module.ts]
import { Module } from 'next-js-backend';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

```typescript [src/modules/app/app.controller.ts]
import { Controller, Get } from 'next-js-backend';
import { AppService } from './app.service';

@Controller('/')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('/')
  getHello() {
    return this.appService.getHello();
  }
}
```

```typescript [src/modules/app/app.service.ts]
import { Injectable } from 'next-js-backend';

@Injectable()
export class AppService {
  getHello() {
    return { message: 'Hello từ next-js-backend! 🚀' };
  }
}
```

:::

### Bước 4 — Chạy

```bash
bun run src/main.ts
```

Vào `http://localhost:3000` — JSON response hiện ra là xong.
