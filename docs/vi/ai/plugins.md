# AI Plugins

Plugins extend agents with additional capabilities like web search and safe database querying.

## SearchPlugin

Integrates [Tavily Search](https://tavily.com/) for real-time web search:

```typescript
import { SearchPlugin } from 'next-js-backend/ai';

AiModule.register({
  plugins: [
    new SearchPlugin({ apiKey: process.env.TAVILY_API_KEY! }),
  ],
})
```

### Tool exposed to agents

- **`web_search`** — `{ query: string, maxResults?: number }` — returns ranked search results

---

## DatabasePlugin

Allows agents to query your database with SQL injection protection:

```typescript
import { DatabasePlugin } from 'next-js-backend/ai';

AiModule.register({
  plugins: [
    new DatabasePlugin({
      query: (sql: string) => prisma.$queryRawUnsafe(sql),
      allowedTables: ['users', 'products', 'orders'],
    }),
  ],
})
```

### Tool exposed to agents

- **`query_database`** — `{ sql: string }` — executes a validated SQL `SELECT` query

### Security Model

The `DatabasePlugin` enforces strict SQL validation:

- ✅ Only `SELECT` queries allowed
- ✅ Only `allowedTables` can be accessed
- ❌ Blocks `DROP`, `DELETE`, `UPDATE`, `INSERT`, `UNION`, `WITH`, `xp_`, `INFORMATION_SCHEMA`
- ❌ Blocks subquery bypasses and block comments

::: danger
Never pass `allowedTables: ['*']`. Always explicitly list tables the agent is allowed to read.
:::

---

## Custom Plugins

Implement the `AiPlugin` interface:

```typescript
import type { AiPlugin } from 'next-js-backend/ai';
import type { ToolEntry } from 'next-js-backend/ai';

export class WeatherPlugin implements AiPlugin {
  getTools(): ToolEntry[] {
    return [
      {
        name: 'get_weather',
        description: 'Get current weather for a city',
        parameters: {
          type: 'object',
          properties: {
            city: { type: 'string', description: 'City name' }
          },
          required: ['city'],
        },
        handler: async ({ city }: { city: string }) => {
          const res = await fetch(`https://api.weather.com/v1/${city}`);
          return res.json();
        },
        instance: this,
      }
    ];
  }
}
```

```typescript
AiModule.register({
  plugins: [new WeatherPlugin()],
})
```

## AI Testing Utilities

See [Testing Guide](/guide/testing.md#ai-testing-utilities) for `AiTestBed` and `MockLLMProvider`.
