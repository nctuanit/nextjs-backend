<p align="center">
  <img src="docs/src/assets/logo.png" width="300" alt="Next.js Backend Logo" />
</p>

# Next.js Backend (Elysia Nest-like Framework)

A custom, high-performance Node/Bun backend framework built on top of **ElysiaJS**. It brings the familiar, highly-structured **NestJS architecture** (Decorators, Dependency Injection, Modules, Guards, Interceptors) to the lightning-fast Elysia ecosystem.

Designed meticulously to be **Serverless & Edge Ready**, dropping right into Next.js App Router API endpoints via `next-js-backend`.

---

## 🚀 Features

- **NestJS-like Architecture**: Structure your app with `@Controller`, `@Injectable`, and `@Module`.
- **ElysiaJS Core**: Powered by ElysiaJS and Bun for maximum performance and TypeBox integration.
- **Dependency Injection**: Full-featured IoC container supporting `useClass`, `useValue`, `useFactory`, and standard constructor injection.
- **Pipeline Processing**: 
  - **Guards** (`@UseGuards`): For authentication and authorization.
  - **Interceptors** (`@UseInterceptors`): For request/response logging, transformation, and mutations.
  - **Pipes** (`@UsePipes`): For data validation (supports built-in `ValidationPipe` with `class-validator`).
  - **Filters** (`@UseFilters`, `@Catch`): Global & scoped Custom Exception Handlers.
- **Session Management**: Built-in cookie-based `SessionModule` with Pluggable Storage (Redis/DB/Memory).
- **Core Modules**: Built-in `ConfigModule` (Env validation), `JwtModule` (Authentication), and `LoggerService`.
- **Next.js API Routing**: Drop-in compatible with `export const { GET, POST } = bootstrap()`
- **File Uploads**: Native support for `@File()` / `@Files()` via `multipart/form-data`.
- **OpenAPI / Swagger**: First-class support via native Elysia plugins.

---

## 📦 Tech Stack

- **Runtime**: [Bun](https://bun.sh/)
- **Core Server**: [ElysiaJS](https://elysiajs.com/)
- **Validation**: [TypeBox](https://github.com/sinclairzx81/typebox) (Native Elysia) & [class-validator](https://github.com/typestack/class-validator)
- **Metadata**: `reflect-metadata`

---

## 🛠️ Getting Started

### Installation

```bash
# Clone the repository and install dependencies
bun install
```

### Running Samples

We provide several sample applications in the `samples/` directory to help you get started:

```bash
# Basic Controller & DI Pattern
bun run start:basic

# Data Validation with DTOs and class-validator
bun run start:validation

# Guards and Interceptors flow
bun run start:guards

# OpenAPI Swagger documentation (Listening on port 3003)
bun run start:swagger
```

---

## 📖 Core Concepts

### 1. Controllers & Routing

Controllers are responsible for handling incoming requests and returning responses. Use route decorators (`@Get`, `@Post`, etc.) and parameter decorators (`@Body`, `@Param`, `@Query`, `@Headers`, `@Req`, `@Res`, `@Session`, `@File`, `@Files`) to extract data.

```typescript
import { Controller, Get, Post, Body, Param } from './src';

@Controller('/users')
export class UsersController {
  @Get()
  getAllUsers() {
    return [{ id: 1, name: 'Alice' }];
  }

  @Post()
  createUser(@Body() body: any) {
    return { success: true, data: body };
  }
}
```

### 2. Dependency Injection (Services)

Mark services with `@Injectable()` so they can be injected into Controllers or other services.

```typescript
import { Injectable, Controller, Get } from './src';

@Injectable()
export class UsersService {
  getUsers() {
    return ['Alice', 'Bob'];
  }
}

@Controller('/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  get() {
    return this.usersService.getUsers();
  }
}
```

### 3. Validation Pipeline

You can validate incoming data using either **TypeBox** (Elysia's native way) or **class-validator** (NestJS standard way).

**Using Class Validator (DTOs):**
```typescript
import { IsString, IsEmail } from 'class-validator';
import { Body, Post, Controller, UsePipes, ValidationPipe } from './src';

class CreateUserDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;
}

@Controller('/users')
export class UsersController {
  @Post()
  @UsePipes(new ValidationPipe())
  create(@Body() dto: CreateUserDto) {
    return dto;
  }
}
```

### 4. Guards & Interceptors

**Guards** determine whether a request will be handled by the route handler.
**Interceptors** bind extra logic before / after method execution.

```typescript
import { CanActivate, Context, NextInterceptor } from './src/interfaces';

export class AuthGuard implements CanActivate {
  async canActivate(context: Context): Promise<boolean> {
    const token = context.request.headers.get('authorization');
    return token === 'Bearer secret';
  }
}

export class LoggingInterceptor implements NextInterceptor {
  async intercept(context: Context, next: () => Promise<unknown>) {
    console.log('Before execution...');
    const result = await next();
    console.log('After execution...');
    return result;
  }
}
```

Apply them using decorators:
```typescript
@UseGuards(AuthGuard)
@UseInterceptors(LoggingInterceptor)
@Get('/secure')
getSecureData() { ... }
```

```

### 5. Exception Filters (Error Handling)

Take complete control over the Error/Response lifecycle. Catch unexpected `Error` instances directly on Route bounds just like NestJS.

```typescript
import { Catch, ExceptionFilter, UseFilters, Controller, Get } from 'next-js-backend';

class CustomError extends Error {}

@Catch(CustomError) // Catch only CustomError
export class MyExceptionFilter implements ExceptionFilter {
  catch(exception: CustomError, context: any) {
    context.set.status = 503;
    return {
      message: "Internal Logic Overridden",
      errorDetails: exception.message
    }
  }
}

@Controller('/users')
export class UsersController {
  @Get()
  @UseFilters(MyExceptionFilter)
  crash() { throw new CustomError("Oh no!"); }
}
```

### 6. Bootstrapping & Next.js App Router Integration

Assemble your application using `@Module` and start it with `ElysiaFactory`. You can extract the fetch handler `app.handle` to instantly plug into Next.js Edge/Node API Routes.

**For Standalone Server (index.ts):**
```typescript
import { Module, ElysiaFactory } from './src';

@Module({
  controllers: [UsersController],
  providers: [UsersService]
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

**For Next.js App Router (app/api/[...slug]/route.ts):**
```typescript
const initApp = async () => {
  const app = await ElysiaFactory.create(AppModule, { globalPrefix: '/api' });
  return app.handle; // Return Next.js compatible standard Web Request handler
};

export const GET = initApp();
export const POST = initApp();
export const PUT = initApp();
export const DELETE = initApp();
```

### 7. Built-in Modules (Enterprise Features)

The framework ships with powerful internal modules to bootstrap applications securely and efficiently:

**ConfigModule (Environment Validation):**
```typescript
import { ConfigModule } from './src';
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

**JwtModule, AuthGuard & PasswordService (Hashing):**
```typescript
import { JwtModule, AuthGuard, PasswordService, UseGuards, Controller, Get } from './src';

@Module({
  imports: [
    JwtModule.register({ secret: 'my-super-secret', expiresIn: '1h' })
  ],
  providers: [PasswordService]
})
class AuthModule {}

@Controller('/profile')
@UseGuards(AuthGuard)
export class ProfileController {
  constructor(private password: PasswordService) {}

  @Get('/me')
  async getSecretData() { 
    const hash = await this.password.hash("mypassword", { algorithm: 'argon2id' });
    return { status: "Secure data", hash }; 
  }
}
```
**SessionModule (Cookie Based Secure Storage):**
```typescript
import { SessionModule, Controller, Get, Session } from './src';

@Module({
  imports: [
    SessionModule.register({
      secret: 'super-secret', // Signs the Cookie
      cookieName: 'sid',
      ttl: 86400 // 1 day expiration
    })
  ]
})
class WebAppModule {}

@Controller('/profile')
export class ProfileController {
  @Get('/me')
  getProfile(@Session() session: any) {
    return session || { message: "Not logged in via cookie!" };
  }
}
```
**Built-in LoggerService:**
```typescript
import { Logger } from './src';

const logger = new Logger('MyContext');
logger.log('Standard log message');
logger.error('Error occurred', error.stack);
logger.warn('Warning log');
```

## 🌍 Global Type Augmentation

To achieve maximum type safety when using `@Session()` or custom guards, the framework exposes global interfaces that you can augment in your own `.d.ts` files (e.g., `globals.d.ts` or `next-env.d.ts`).

```typescript
// types.d.ts
import 'next-js-backend';

declare module 'next-js-backend' {
  interface SessionData {
    userId: string;
    role: 'admin' | 'user';
    preferences: { theme: string };
  }

  interface User {
    id: number;
    email: string;
    isActive: boolean;
  }
}
```

Now, whenever you inject `@Session() session`, your IDE will perfectly auto-complete `session.role` and `session.userId`!

---

## 🧪 Testing

We use Bun's native test runner (`bun:test`). Tests are located alongside their respective source files in `__tests__` directories.

```bash
bun test
```
