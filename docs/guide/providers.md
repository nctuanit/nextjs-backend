# Providers

Providers are the fundamental concept in `next-js-backend`. Many built-in classes — services, repositories, helpers — can be treated as providers. The main idea of a provider is that it can be **injected** as a dependency.

## Services

The most common type of provider is a **service**:

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

## Dependency Injection

Inject providers into controllers or other services via the constructor:

```typescript
@Controller('/users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly logger: Logger,
  ) {}
}
```

::: tip
The DI container resolves dependencies automatically based on TypeScript metadata (`reflect-metadata`). Make sure `emitDecoratorMetadata: true` is set in `tsconfig.json`.
:::

## Provider Types

### Class Provider (default)

```typescript
@Module({
  providers: [UserService], // shorthand for { provide: UserService, useClass: UserService }
})
```

### Value Provider

Inject a static value (config, constants):

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
import { Inject } from 'next-js-backend';

@Injectable()
export class AppService {
  constructor(@Inject('APP_CONFIG') private config: AppConfig) {}
}
```

### Factory Provider

```typescript
@Module({
  providers: [
    {
      provide: 'DB_CONNECTION',
      useFactory: async (config: ConfigService) => {
        return await createConnection(config.get('DATABASE_URL'));
      },
      inject: [ConfigService],
    },
  ],
})
```

### Existing Provider (alias)

```typescript
{
  provide: 'LOGGER',
  useExisting: Logger,
}
```

## Custom Injection Tokens

Use string or Symbol tokens for non-class providers:

```typescript
export const REDIS_CLIENT = 'REDIS_CLIENT';

@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: () => new Redis(process.env.REDIS_URL),
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule {}
```

```typescript
@Injectable()
export class CacheService {
  constructor(@Inject(REDIS_CLIENT) private redis: Redis) {}
}
```

## Circular Dependency Detection

The DI container automatically detects circular dependencies:

```
Error: Circular dependency detected while resolving "ServiceA".
Check your provider dependency graph.
```

Fix circular deps by:
- Extracting shared logic into a third service
- Using `forwardRef()` (if supported)
- Restructuring modules

## Scopes

By default all providers are **singletons** — one instance per application lifecycle. This is ideal for stateless services.
