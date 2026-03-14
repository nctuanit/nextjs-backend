/**
 * Eden Treaty Sample - Client Usage (Type-Safe!)
 *
 * This client uses auto-generated types from `eden.d.ts`.
 * 
 * To regenerate types after changing controllers:
 *   bun run scripts/eden-generate.ts samples/eden-treaty/src/app.module.ts --output samples/eden-treaty/eden.d.ts
 *
 * Make sure the server is running first:
 *   bun run samples/eden-treaty/server.ts
 *
 * Then run this client:
 *   bun run samples/eden-treaty/client.ts
 */
import { treaty } from '@elysiajs/eden';
import type { App } from './eden';

// ✅ Full type-safe API client powered by auto-generated Eden types!
const api = treaty<App>('http://localhost:3005');

async function main() {
  console.log('📡 Calling GET /todos ...');
  const { data: todos, error: getError } = await api.todos.get();
  if (getError) {
    console.error('❌ GET Error:', getError);
  } else {
    console.log('✅ Todos:', todos);
  }

  console.log('\n📡 Calling POST /todos ...');
  const { data: newTodo, error: postError } = await api.todos.post({ title: 'Use Eden Treaty!' });
  if (postError) {
    console.error('❌ POST Error:', postError);
  } else {
    console.log('✅ Created:', newTodo);
  }

  console.log('\n📡 Calling GET /todos again ...');
  const { data: updatedTodos, error: getError2 } = await api.todos.get();
  if (getError2) {
    console.error('❌ GET Error:', getError2);
  } else {
    console.log('✅ Updated Todos:', updatedTodos);
  }
}

main().catch(console.error);
