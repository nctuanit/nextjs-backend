# Controllers

Controller lo việc nhận HTTP request và trả về response. Mỗi controller thường đại diện cho một "tài nguyên" — ví dụ `/users`, `/products`, `/orders`.

## Tạo Controller

Gắn `@Controller()` lên class là xong:

```typescript
import { Controller, Get, Post, Put, Delete, Body, Param, Query } from 'next-js-backend';

@Controller('/users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('/')
  findAll() {
    return this.userService.findAll();
  }

  @Get('/:id')
  findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @Post('/')
  create(@Body() dto: CreateUserDto) {
    return this.userService.create(dto);
  }

  @Put('/:id')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.userService.update(id, dto);
  }

  @Delete('/:id')
  remove(@Param('id') id: string) {
    return this.userService.remove(id);
  }
}
```

## Các Route Decorator

| Decorator | HTTP Method |
|-----------|-------------|
| `@Get(path)` | GET |
| `@Post(path)` | POST |
| `@Put(path)` | PUT |
| `@Patch(path)` | PATCH |
| `@Delete(path)` | DELETE |
| `@All(path)` | Tất cả |

## Lấy Dữ Liệu Từ Request

### `@Param` — Lấy path param

```typescript
@Get('/:id')
findOne(@Param('id') id: string) {}

// Lấy hết một lúc
@Get('/:category/:id')
find(@Param() params: { category: string; id: string }) {}
```

### `@Query` — Lấy query string

```typescript
@Get('/')
findAll(@Query('page') page: string, @Query('limit') limit: string) {}

// Hoặc lấy tất cả
@Get('/search')
search(@Query() query: Record<string, string>) {}
```

### `@Body` — Lấy body request

```typescript
@Post('/')
create(@Body() body: CreateUserDto) {}

// Lấy một field cụ thể
@Post('/')
create(@Body('email') email: string) {}
```

### `@Headers` — Lấy header

```typescript
@Get('/')
withHeader(@Headers('authorization') auth: string) {}
```

## Đừng Quên Đăng Ký Vào Module

Controller sẽ không hoạt động nếu chưa khai báo trong `@Module`:

```typescript
@Module({
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
```
