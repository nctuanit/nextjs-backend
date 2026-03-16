# First Steps

This guide walks you through setting up your first `next-js-backend` application.

## Prerequisites

- **Bun** `>= 1.0` — [Install Bun](https://bun.sh)
- **TypeScript** `>= 5.0`

## Create a New Project

Use the CLI to scaffold a project instantly:

```bash
npx next-js-backend new my-api
cd my-api
bun install
bun run dev
```

Your server is now running at `http://localhost:3000` 🚀

## Manual Setup

If you prefer to set up manually:

### 1. Install dependencies

```bash
bun add next-js-backend elysia reflect-metadata
bun add -d typescript @types/bun
```

### 2. Configure TypeScript

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

### 3. Create your first module

::: code-group

```typescript [src/main.ts]
import 'reflect-metadata';
import { ElysiaFactory } from 'next-js-backend';
import { AppModule } from './modules/app/app.module';

const app = await ElysiaFactory.create(AppModule);
app.listen(3000, () => {
  console.log('🚀 Server running at http://localhost:3000');
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
    return { message: 'Hello from next-js-backend! 🚀' };
  }
}
```

:::

### 4. Run

```bash
bun run src/main.ts
```

Visit `http://localhost:3000` — you'll see the JSON response.
