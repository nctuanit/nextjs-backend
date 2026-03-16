# Health Check

The `HealthModule` exposes a `/health` endpoint for load balancers, uptime monitors, and container orchestrators (e.g., Kubernetes liveness probes).

## Setup

```typescript
import { Module, HealthModule } from 'next-js-backend';

@Module({
  imports: [HealthModule],
})
export class AppModule {}
```

## Endpoints

### `GET /health`

Returns the application health status:

```json
{
  "status": "ok",
  "uptime": 3612,
  "timestamp": "2024-03-16T10:30:00.000Z",
  "version": "2.1.3"
}
```

### `GET /health/live`

Kubernetes liveness probe — returns `200 OK` if the process is alive.

### `GET /health/ready`

Kubernetes readiness probe — returns `200 OK` if the application is ready to accept traffic.

## Custom Health Checks

Inject `HealthService` to add custom checks:

```typescript
import { Injectable } from 'next-js-backend';
import { HealthService } from 'next-js-backend';

@Injectable()
export class AppHealthService {
  constructor(private readonly health: HealthService) {}

  async checkDatabase(): Promise<boolean> {
    try {
      await db.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }
}
```

## Use in Monitoring

Configure your health check monitors:

```yaml
# Docker Compose health check
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
  interval: 30s
  timeout: 10s
  retries: 3
```

```yaml
# Kubernetes liveness probe
livenessProbe:
  httpGet:
    path: /health/live
    port: 3000
  initialDelaySeconds: 30
  periodSeconds: 10
```
