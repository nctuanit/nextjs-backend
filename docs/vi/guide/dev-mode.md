# Dev Mode Profiler

The `DevModeModule` provides a real-time HTTP request profiler for development. It tracks request duration, status codes, headers, and bodies — exposed via a REST API.

## Setup

```typescript
import { Module, DevModeModule } from 'next-js-backend';

@Module({
  imports: [
    DevModeModule.register({
      enabled: process.env.NODE_ENV !== 'production',
      maxHistory: 200,
    }),
  ],
})
export class AppModule {}
```

::: warning Production Safety
`DevModeModule` **automatically disables itself** when `enabled: false`. It is safe to import unconditionally — no overhead in production.
:::

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /__dev/requests` | List recent requests (newest first) |
| `DELETE /__dev/requests` | Clear history |
| `GET /__dev/stats` | Aggregated statistics |

### Sample Response

```json
[
  {
    "id": "uuid",
    "method": "POST",
    "url": "/api/users",
    "status": 201,
    "durationMs": 45.2,
    "timestamp": "2024-03-16T10:30:00.000Z",
    "body": { "name": "Alice" }
  }
]
```

### Stats Response

```json
{
  "totalRequests": 120,
  "avgDuration": 23.4,
  "errorRate": 2.5,
  "statusCodes": { "200": 100, "404": 15, "500": 5 }
}
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | `boolean` | `false` | Enable the module |
| `maxHistory` | `number` | `100` | Max requests stored in memory |

## Memory Safety

Request history is trimmed to `maxHistory` entries automatically — no unbounded memory growth.
