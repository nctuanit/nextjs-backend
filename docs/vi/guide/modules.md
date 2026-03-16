# Modules

Module là khối xây dựng cơ bản của ứng dụng. Mỗi tính năng nên có module riêng — rõ ràng, dễ chia nhỏ, dễ test.

## Cấu Trúc Một Module

```typescript
import { Module } from 'next-js-backend';

@Module({
  imports: [DatabaseModule, SharedModule],   // import module khác
  controllers: [UserController],             // xử lý HTTP request
  providers: [UserService, UserRepository], // service, repo...
  exports: [UserService],                   // chia sẻ cho module khác dùng
})
export class UserModule {}
```

### Giải thích từng trường

| Trường | Tác dụng |
|--------|---------|
| `imports` | Kéo provider đã export của module khác vào đây |
| `controllers` | HTTP controllers của module này |
| `providers` | Service, repo, helper... dùng trong module |
| `exports` | Provider nào muốn cho module khác dùng thì export ra |

## Root Module — Điểm Xuất Phát

```typescript
@Module({
  imports: [
    UserModule,
    ProductModule,
    DatabaseModule,
    ConfigModule,
  ],
})
export class AppModule {}
```

```typescript
const app = await ElysiaFactory.create(AppModule);
```

## Chia Nhỏ Theo Tính Năng

Đây là cách tổ chức chuẩn:

```
src/
├── modules/
│   ├── users/
│   │   ├── users.module.ts
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   └── users.repository.ts
│   ├── products/
│   └── orders/
└── app.module.ts
```

## Module Dùng Chung

Muốn dùng service ở nhiều module? Export nó ra:

```typescript
@Module({
  providers: [CryptoService],
  exports: [CryptoService],  // module nào import SharedModule thì dùng được CryptoService
})
export class SharedModule {}
```

## Dynamic Module — Module Cần Config

Dùng khi module cần tham số lúc runtime (như database URL, secret key...):

```typescript
@Module({})
export class DatabaseModule {
  static register(options: DatabaseOptions): DynamicModule {
    return {
      module: DatabaseModule,
      providers: [
        { provide: 'DB_OPTIONS', useValue: options },
        DatabaseService,
      ],
      exports: [DatabaseService],
    };
  }
}
```

```typescript
// Dùng như này
DatabaseModule.register({ url: process.env.DATABASE_URL! })
```

## Modules Tích Hợp Sẵn

| Module | Import từ |
|--------|---------|
| `ConfigModule` | `'next-js-backend'` |
| `JwtModule` | `'next-js-backend'` |
| `SessionModule` | `'next-js-backend'` |
| `CacheModule` | `'next-js-backend'` |
| `ScheduleModule` | `'next-js-backend'` |
| `AiModule` | `'next-js-backend'` |
| `DevModeModule` | `'next-js-backend'` |
