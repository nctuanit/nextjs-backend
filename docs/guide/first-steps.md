# First Steps

This guide walks you through setting up your first `next-js-backend` application.

## Prerequisites

- **Bun** `>= 1.0` — [Install Bun](https://bun.sh) **or** **Node.js** `>= 20.0` — [nodejs.org](https://nodejs.org)
- **TypeScript** `>= 5.0`

## Create a New Project

Use the CLI to scaffold a project instantly:

::: code-group

```bash [bun]
npx next-js-backend new my-api
cd my-api
bun install
bun run dev
```

```bash [node]
npx next-js-backend new my-api
cd my-api
npm install
npm run dev
```

:::

Your server is now running at `http://localhost:3000` 🚀

## Manual Setup

### 1. Install dependencies

::: code-group

```bash [bun]
bun add next-js-backend elysia reflect-metadata
bun add -d typescript @types/bun
```

```bash [npm]
npm install next-js-backend elysia reflect-metadata
npm install -D typescript @types/node
```

```bash [pnpm]
pnpm add next-js-backend elysia reflect-metadata
pnpm add -D typescript @types/node
```

:::

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

::: warning Required flags
`experimentalDecorators` and `emitDecoratorMetadata` are both required. The framework relies on TypeScript's decorator metadata emission (`reflect-metadata`) for the DI container to resolve constructor parameter types automatically.
:::

### 3. Create your first module

::: code-group

```typescript [src/main.ts]
import 'reflect-metadata';
import { ElysiaFactory } from 'next-js-backend';
import { AppModule } from './modules/app/app.module';

const app = await ElysiaFactory.create(AppModule);
app.listen(3000, () => {
  Logger.log('🚀 Server running at http://localhost:3000');
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
    return { message: 'Hello from next-js-backend!' };
  }
}
```

:::

### 4. Run

::: code-group

```bash [bun]
bun run src/main.ts
```

```bash [node (tsx)]
npx tsx src/main.ts
```

```bash [node (ts-node)]
npx ts-node --esm src/main.ts
```

:::

Visit `http://localhost:3000` — you'll see the JSON response.
