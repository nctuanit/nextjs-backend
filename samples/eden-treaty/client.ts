/**
 * Eden Treaty Sample - Type-Safe Client
 *
 * This client uses auto-generated types from `eden.ts`.
 * Eden Treaty provides FULL autocomplete for routes, request bodies,
 * and response types — powered by TypeScript generics.
 * 
 * To regenerate types after changing controllers:
 *   bun run eden:generate samples/eden-treaty/src/app.module.ts --output samples/eden-treaty/eden.ts
 *
 * Make sure the server is running first:
 *   bun run samples/eden-treaty/server.ts
 *
 * Then run this client:
 *   bun run samples/eden-treaty/client.ts
 */
import { treaty } from '@elysiajs/eden';
import type { App } from './eden';

// ✅ Type-safe API client: autocomplete works for routes, bodies, and responses!
const api = treaty<App>('http://localhost:3005');

async function main() {
  // ✅ TypeScript knows this returns Todo[]
  console.log('📡 Calling GET /todos ...');
  const { data: todos, error: getError } = await api.todos.get();
  if (getError) throw getError;
  console.log('✅ Todos:', todos);
  // todos[0].title  ← autocomplete works!

  // ✅ TypeScript enforces { title: string } body shape 
  console.log('\n📡 Calling POST /todos ...');
  const { data: newTodo, error: postError } = await api.todos.post({
    title: 'Use Eden Treaty!', // ← try removing this, TS will error
  });
  if (postError) throw postError;
  console.log('✅ Created:', newTodo);
  // newTodo.id  ← autocomplete works!

  // ✅ Fetch updated list
  console.log('\n📡 Calling GET /todos again ...');
  const { data: updatedTodos, error: getError2 } = await api.todos.get();
  if (getError2) throw getError2;
  console.log('✅ Updated Todos:', updatedTodos);
}

main().catch(console.error);
