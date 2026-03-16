# Config Module

The `ConfigModule` provides strongly-typed, environment-variable-based configuration with TypeBox schema validation.

## Setup

```typescript
import { Module, ConfigModule } from 'next-js-backend';
import { Type as t } from '@sinclair/typebox';

@Module({
  imports: [
    ConfigModule.register({
      schema: t.Object({
        PORT: t.Number({ default: 3000 }),
        NODE_ENV: t.Union([
          t.Literal('development'),
          t.Literal('production'),
          t.Literal('test'),
        ], { default: 'development' }),
        DATABASE_URL: t.String(),
        JWT_SECRET: t.String(),
        REDIS_URL: t.Optional(t.String()),
      }),
    }),
  ],
})
export class AppModule {}
```

## Using ConfigService

```typescript
import { Injectable } from 'next-js-backend';
import { ConfigService } from 'next-js-backend';

@Injectable()
export class DatabaseService {
  constructor(private config: ConfigService) {}

  connect() {
    const url = this.config.get('DATABASE_URL');
    const port = this.config.get('PORT'); // typed as number
    return connectToDb(url);
  }
}
```

`ConfigService.get(key)` returns the value with the **TypeBox-inferred type** — no manual casting needed.

## Type-safe Config

TypeBox ensures:
- Missing required vars → startup error (fail-fast)
- Wrong type → automatic coercion or error
- Default values → applied automatically

## `.env` File

```ini [.env]
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://user:pass@localhost:5432/mydb
JWT_SECRET=super-secret-key
```

## Env Validation

Variables are validated at startup. If `DATABASE_URL` is missing:

```
Error: Config validation failed:
  [DATABASE_URL] Required string property is missing
```

This ensures your app never starts with invalid configuration.
