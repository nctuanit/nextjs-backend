# Workflow Engine

The Workflow Engine provides structured multi-step processes with sequential/parallel execution, retries, and conditional branching.

## Defining a Workflow

```typescript
import { Injectable } from 'next-js-backend';
import { Workflow, Step } from 'next-js-backend/ai';
import { WorkflowContext } from 'next-js-backend/ai';

@Injectable()
@Workflow({ name: 'OrderFulfillmentWorkflow' })
export class OrderFulfillmentWorkflow {
  constructor(
    private readonly inventory: InventoryService,
    private readonly shipping: ShippingService,
    private readonly notifications: NotificationService,
  ) {}

  // Step 1: check inventory
  @Step({ order: 1 })
  async checkInventory(ctx: WorkflowContext) {
    const orderId = ctx.get<string>('orderId');
    const items = ctx.get<OrderItem[]>('items');
    
    const available = await this.inventory.checkAll(items);
    ctx.set('inventoryAvailable', available);
    
    if (!available) {
      throw new Error('Some items are out of stock');
    }
  }

  // Steps 2a and 2b run in PARALLEL
  @Step({ order: 2, parallel: true })
  async reserveInventory(ctx: WorkflowContext) {
    const items = ctx.get<OrderItem[]>('items');
    await this.inventory.reserve(items);
    ctx.set('inventoryReserved', true);
  }

  @Step({ order: 2, parallel: true })
  async calculateShipping(ctx: WorkflowContext) {
    const address = ctx.get<Address>('shippingAddress');
    const cost = await this.shipping.calculate(address);
    ctx.set('shippingCost', cost);
  }

  // Step 3: create shipment
  @Step({ order: 3 })
  async createShipment(ctx: WorkflowContext) {
    const orderId = ctx.get<string>('orderId');
    const address = ctx.get<Address>('shippingAddress');
    const tracking = await this.shipping.create({ orderId, address });
    ctx.set('trackingNumber', tracking);
  }

  // Step 4: only if high-value order
  @Step({ order: 4, when: (ctx) => (ctx.get<number>('orderTotal') ?? 0) > 1000 })
  async flagForReview(ctx: WorkflowContext) {
    ctx.set('requiresReview', true);
  }

  // Step 5: notify customer — retry up to 3 times
  @Step({ order: 5, retries: 3 })
  async notifyCustomer(ctx: WorkflowContext) {
    const orderId = ctx.get<string>('orderId');
    const tracking = ctx.get<string>('trackingNumber');
    await this.notifications.sendShippingConfirmation({ orderId, tracking });
  }
}
```

## Running a Workflow

```typescript
import { WorkflowRuntime } from 'next-js-backend/ai';

const result = await WorkflowRuntime.execute(orderWorkflow, {
  orderId: 'ORD-123',
  items: [{ id: 'p_1', qty: 2 }],
  shippingAddress: { city: 'Hanoi', country: 'VN' },
  orderTotal: 1500,
});

if (result.status === 'completed') {
  console.log('Done in', result.duration, 'ms');
  console.log('Tracking:', result.context.trackingNumber);
} else {
  console.error('Failed at step:', result.steps.find(s => s.status === 'failed'));
}
```

## WorkflowResult

```typescript
interface WorkflowResult {
  workflowName: string;
  status: 'completed' | 'failed';
  steps: StepResult[];
  context: Record<string, unknown>;
  duration: number; // ms
}

interface StepResult {
  stepName: string;
  status: 'completed' | 'failed' | 'skipped';
  output?: unknown;
  error?: string;
  duration: number;
  attempts: number;
}
```

## WorkflowContext API

```typescript
ctx.set('key', value);           // Store a value
ctx.get<T>('key');               // Retrieve typed value
ctx.has('key');                  // Check existence
ctx.delete('key');               // Remove
ctx.toObject();                  // Get all as plain object
ctx.stepResults['stepName'];     // Access previous step output
```

## Step Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `order` | `number` | `0` | Execution order (lower = earlier) |
| `retries` | `number` | `0` | Retry attempts on failure |
| `parallel` | `boolean` | `false` | Run concurrently with same-order steps |
| `when` | `(ctx) => boolean` | — | Skip condition |

::: tip Parallel Execution
All steps with the **same `order`** value AND `parallel: true` run simultaneously via `Promise.allSettled`.
:::
