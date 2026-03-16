# Providers

Providers là "linh hồn" của DI trong `next-js-backend`. Service, repository, helper... đều là providers — chỉ cần gắn `@Injectable()` vào là có thể inject ở bất kỳ đâu.

## Service — Dạng Phổ Biến Nhất

```typescript
import { Injectable } from 'next-js-backend';

@Injectable()
export class UserService {
  private users: User[] = [];

  findAll(): User[] {
    return this.users;
  }

  findOne(id: string): User | null {
    return this.users.find(u => u.id === id) ?? null;
  }

  create(dto: CreateUserDto): User {
    const user = { id: crypto.randomUUID(), ...dto };
    this.users.push(user);
    return user;
  }
}
```

## Inject Vào Đâu Cũng Được

Chỉ cần khai báo qua constructor — DI container lo phần còn lại:

```typescript
@Controller('/users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly logger: Logger,
  ) {}
}
```

::: tip Lưu ý nhỏ
DI dựa vào TypeScript metadata nên `emitDecoratorMetadata: true` phải được bật trong `tsconfig.json`, còn nếu không thì sẽ không inject được gì cả.
:::

## Các Kiểu Provider

### Class Provider (ngắn nhất)

```typescript
@Module({
  providers: [UserService], // tương đương { provide: UserService, useClass: UserService }
})
```

### Value Provider — Inject giá trị cố định

Dùng khi cần inject config, constants:

```typescript
@Module({
  providers: [
    {
      provide: 'APP_CONFIG',
      useValue: { name: 'MyApp', version: '1.0' },
    },
  ],
})
```

```typescript
@Injectable()
export class AppService {
  constructor(@Inject('APP_CONFIG') private config: AppConfig) {}
}
```

### Factory Provider — Inject từ hàm khởi tạo

Hữu ích khi cần async setup hoặc phụ thuộc vào provider khác:

```typescript
{
  provide: 'DB_CONNECTION',
  useFactory: async (config: ConfigService) => {
    return await createConnection(config.get('DATABASE_URL'));
  },
  inject: [ConfigService],
}
```

## Cảnh Báo Circular Dependency

DI container phát hiện circular dependency ngay khi khởi động:

```
Error: Circular dependency detected while resolving "ServiceA".
```

Cách xử lý đơn giản nhất: tách logic dùng chung ra service thứ ba, thay vì để hai service phụ thuộc lẫn nhau.
