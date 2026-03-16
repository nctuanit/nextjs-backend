# Controllers

Controllers are responsible for handling incoming **HTTP requests** and returning **responses**. A controller's purpose is to receive specific requests for the application — the routing mechanism controls which controller receives which requests.

## Creating a Controller

Use the `@Controller()` decorator to define a controller class:

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

## Route Decorators

| Decorator | HTTP Method |
|-----------|-------------|
| `@Get(path)` | GET |
| `@Post(path)` | POST |
| `@Put(path)` | PUT |
| `@Patch(path)` | PATCH |
| `@Delete(path)` | DELETE |
| `@Options(path)` | OPTIONS |
| `@Head(path)` | HEAD |
| `@All(path)` | All methods |

## Parameter Decorators

### `@Param` — Route parameters

```typescript
@Get('/:id')
findOne(@Param('id') id: string) {}

// Get all params as object
@Get('/:category/:id')
find(@Param() params: { category: string; id: string }) {}
```

### `@Query` — Query strings

```typescript
@Get('/')
findAll(@Query('page') page: string, @Query('limit') limit: string) {}

// Get all query params
@Get('/search')
search(@Query() query: Record<string, string>) {}
```

### `@Body` — Request body

```typescript
@Post('/')
create(@Body() body: CreateUserDto) {}

// Get specific field
@Post('/')
create(@Body('email') email: string) {}
```

### `@Headers` — Request headers

```typescript
@Get('/')
withHeader(@Headers('authorization') auth: string) {}
```

### `@Req` / `@Res` — Raw context

```typescript
import { Req, Res } from 'next-js-backend';

@Get('/raw')
raw(@Req() req: Request, @Res() res: any) {
  return { url: req.url };
}
```

## Global Prefix

Add a global prefix to all routes:

```typescript
const app = await ElysiaFactory.create(AppModule, {
  globalPrefix: '/api',
});
// All routes now at /api/...
```

## Route Wildcards

```typescript
@Controller('/files')
export class FilesController {
  @Get('*')  // matches /files/anything/nested
  findAll() {}
}
```

## Response Status Codes

VitePress returns appropriate HTTP status codes automatically. To customize:

```typescript
@Post('/')
async create(@Body() dto: CreateDto) {
  const item = await this.service.create(dto);
  // Return with explicit status
  return new Response(JSON.stringify(item), { status: 201 });
}
```

## Registering Controllers

Controllers must be registered in a `@Module`:

```typescript
@Module({
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
```
