# Modules

A module is a class annotated with the `@Module()` decorator. Modules organize the application structure — each feature area has its own module.

## Module Anatomy

```typescript
import { Module } from 'next-js-backend';

@Module({
  imports: [DatabaseModule, SharedModule],   // Other modules to import
  controllers: [UserController],             // Request handlers
  providers: [UserService, UserRepository], // Injectable classes
  exports: [UserService],                   // Make available to other modules
})
export class UserModule {}
```

### Options

| Option | Description |
|--------|-------------|
| `imports` | Modules whose exported providers are available here |
| `controllers` | Controllers handled by this module |
| `providers` | Services, repositories, etc. available in this module |
| `exports` | Providers shared with importing modules |

## Root Module

The root `AppModule` is the entry point:

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

## Feature Modules

Organize by domain:

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

## Shared Modules

Export providers for use across modules:

```typescript
@Module({
  providers: [CryptoService],
  exports: [CryptoService],  // Other modules can use CryptoService
})
export class SharedModule {}
```

## Dynamic Modules

Create modules with runtime configuration using static `register()` or `forRoot()` methods:

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
@Module({
  imports: [
    DatabaseModule.register({
      url: process.env.DATABASE_URL!,
      poolSize: 10,
    }),
  ],
})
export class AppModule {}
```

## Built-in Modules

| Module | Import |
|--------|--------|
| `ConfigModule` | `import { ConfigModule } from 'next-js-backend'` |
| `JwtModule` | `import { JwtModule } from 'next-js-backend'` |
| `SessionModule` | `import { SessionModule } from 'next-js-backend'` |
| `CacheModule` | `import { CacheModule } from 'next-js-backend'` |
| `CompressionModule` | `import { CompressionModule } from 'next-js-backend'` |
| `ScheduleModule` | `import { ScheduleModule } from 'next-js-backend'` |
| `EventEmitterModule` | `import { EventEmitterModule } from 'next-js-backend'` |
| `AiModule` | `import { AiModule } from 'next-js-backend'` |
| `DevModeModule` | `import { DevModeModule } from 'next-js-backend'` |
