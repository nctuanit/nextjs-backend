# OpenAPI (Swagger)

Generate interactive API documentation automatically from your controllers.

## Setup

The OpenAPI integration uses Elysia's `@elysiajs/swagger` plugin.

```typescript
import { ElysiaFactory } from 'next-js-backend';
import { swagger } from '@elysiajs/swagger';
import { AppModule } from './app.module';

const app = await ElysiaFactory.create(AppModule);

// Mount Swagger UI
app.use(swagger({
  documentation: {
    info: {
      title: 'My API',
      description: 'API documentation',
      version: '1.0.0',
    },
    tags: [
      { name: 'users', description: 'User operations' },
      { name: 'products', description: 'Product operations' },
    ],
  },
  path: '/docs', // Swagger UI at /docs
}));
```

## Documenting Endpoints

Use TypeBox schemas with Elysia's native schema support via `@Schema`:

```typescript
import { Controller, Get, Post, Body } from 'next-js-backend';
import { Schema } from 'next-js-backend';
import { Type as t } from '@sinclair/typebox';

const CreateUserSchema = t.Object({
  name: t.String({ description: 'Full name', minLength: 1 }),
  email: t.String({ format: 'email' }),
  role: t.Union([t.Literal('admin'), t.Literal('user')], { default: 'user' }),
});

@Controller('/users')
export class UserController {
  @Post('/')
  @Schema({
    body: CreateUserSchema,
    response: { 201: t.Object({ id: t.String(), name: t.String() }) },
    tags: ['users'],
    summary: 'Create a new user',
  })
  create(@Body() body: typeof CreateUserSchema._type) {
    return this.userService.create(body);
  }
}
```

## Sample (via Swagger UI)

Visit `http://localhost:3000/docs` after starting the server to see the interactive Swagger UI.

## API Security Definitions

```typescript
swagger({
  documentation: {
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
})
```

## Installation

```bash
bun add @elysiajs/swagger
```
