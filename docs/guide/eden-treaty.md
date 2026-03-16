# Eden Treaty (Type-Safe Client)

Eden Treaty provides a fully type-safe HTTP client for your API — auto-completing routes, parameter types, and response types, all inferred from your server code.

## Generate Types

```bash
npx next-js-backend eden:generate src/app.module.ts --output src/eden.d.ts
```

Or add to `package.json`:

```json
{
  "scripts": {
    "eden:generate": "npx next-js-backend eden:generate src/app.module.ts --output src/eden.d.ts"
  }
}
```

## Usage in Next.js

```typescript
// lib/api.ts
import { treaty } from '@elysiajs/eden';
import type { App } from './eden.d.ts';

export const api = treaty<App>('http://localhost:3000');

// Use in components/pages
const { data, error } = await api.users.get();
const { data: user } = await api.users({ id: 'u_123' }).get();
const { data: created } = await api.users.post({ name: 'Alice', email: 'alice@example.com' });
```

## Type Safety

All endpoints are typed:

```typescript
// ✅ Correct — TypeScript knows /users/:id needs a string id
const { data } = await api.users({ id: 'u_123' }).get();

// ❌ Error — TypeScript knows 'email' is required
const { data } = await api.users.post({ name: 'Alice' });
//                                      ^^^^^^^^^^^^^^^^
// Argument missing required 'email' field
```

## React Query Integration

```typescript
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';

function UserList() {
  const { data } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.users.get().then(r => r.data),
  });

  const createUser = useMutation({
    mutationFn: (dto: CreateUserDto) => api.users.post(dto),
  });

  return (
    <div>
      {data?.map(user => <div key={user.id}>{user.name}</div>)}
    </div>
  );
}
```

## Installation

```bash
bun add @elysiajs/eden
```
