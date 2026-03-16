# Schedule & Events

## Schedule Module (Cron Jobs)

The `ScheduleModule` allows you to run tasks on a schedule using cron expressions.

### Setup

```typescript
import { Module, ScheduleModule } from 'next-js-backend';

@Module({
  imports: [ScheduleModule],
  providers: [TasksService],
})
export class AppModule {}
```

### Defining Cron Tasks

```typescript
import { Injectable } from 'next-js-backend';
import { Cron } from 'next-js-backend';

@Injectable()
export class TasksService {
  @Cron('0 * * * *')  // every hour
  async handleHourlyTask() {
    console.log('Running hourly task...');
  }

  @Cron('0 0 * * *')  // daily at midnight
  async handleDailyCleanup() {
    await this.cleanupExpiredData();
  }
}
```

### Cron Syntax

Uses standard cron syntax: `second minute hour day month weekday`

| Expression | Description |
|-----------|-------------|
| `* * * * *` | Every minute |
| `0 * * * *` | Every hour |
| `0 0 * * *` | Daily at midnight |
| `0 0 * * 1` | Every Monday |

---

## EventEmitter Module (Pub/Sub)

The `EventEmitterModule` provides in-process event-driven communication between services.

### Setup

```typescript
import { Module, EventEmitterModule } from 'next-js-backend';

@Module({
  imports: [EventEmitterModule],
})
export class AppModule {}
```

### Emitting Events

```typescript
import { Injectable } from 'next-js-backend';
import { EventEmitterService } from 'next-js-backend';

@Injectable()
export class OrderService {
  constructor(private events: EventEmitterService) {}

  async createOrder(data: CreateOrderDto) {
    const order = await this.orderRepo.create(data);
    
    // Emit event — sync or async
    await this.events.emitAsync('order.created', { order });
    
    return order;
  }
}
```

### Listening to Events

```typescript
import { Injectable } from 'next-js-backend';
import { OnEvent } from 'next-js-backend';

@Injectable()
export class NotificationService {
  @OnEvent('order.created')
  async handleOrderCreated(payload: { order: Order }) {
    await this.sendEmail(payload.order.userId, 'Order confirmed!');
  }
}
```

::: tip Memory Safety
`EventEmitterService` supports `removeListeners(eventName)` and `clearAllListeners()` to prevent memory leaks in test suites or hot-reloading scenarios.
:::
