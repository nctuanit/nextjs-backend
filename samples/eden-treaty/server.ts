/**
 * Eden Treaty Sample - Server Entry Point
 *
 * This sample demonstrates how to export the Elysia app type
 * so that @elysiajs/eden can generate a type-safe API client.
 *
 * Run:   bun run samples/eden-treaty/server.ts
 * Test:  bun run samples/eden-treaty/client.ts
 */
import { ElysiaFactory } from 'next-js-backend';
import { AppModule } from './src/app.module';

const app = await ElysiaFactory.create(AppModule);

// 🔑 KEY STEP: Export the app type for Eden Treaty
export type App = typeof app;

app.listen(3005, () => {
  console.log('🚀 Eden Treaty Sample Server running at http://localhost:3005');
  console.log('   Try: bun run samples/eden-treaty/client.ts');
});
