# Schedule & Events

## Schedule — Chạy Theo Lịch (Cron)

### Cài đặt

```typescript
import { Module, ScheduleModule } from 'next-js-backend';

@Module({
  imports: [ScheduleModule],
  providers: [TasksService],
})
export class AppModule {}
```

### Khai báo Cron Job

```typescript
@Injectable()
export class TasksService {
  @Cron('0 * * * *')  // mỗi giờ một lần
  async chayMoiGio() {
    Logger.log('Đang chạy task hàng giờ...');
  }

  @Cron('0 0 * * *')  // nửa đêm mỗi ngày
  async donDepHangNgay() {
    await this.xoaDuLieuCu();
  }
}
```

### Cú Pháp Cron Nhanh

| Biểu thức | Ý nghĩa |
|-----------|---------|
| `* * * * *` | Mỗi phút |
| `0 * * * *` | Mỗi giờ |
| `0 0 * * *` | Mỗi ngày lúc nửa đêm |
| `0 9 * * 1-5` | 9h sáng mỗi ngày làm việc |
| `0 0 1 * *` | Đầu mỗi tháng |

---

## EventEmitter — Pub/Sub Nội Bộ

Giao tiếp giữa các service trong cùng process mà không cần gọi thẳng nhau.

### Cài đặt

```typescript
import { Module, EventEmitterModule } from 'next-js-backend';

@Module({
  imports: [EventEmitterModule],
})
export class AppModule {}
```

### Phát Sự Kiện

```typescript
@Injectable()
export class OrderService {
  constructor(private events: EventEmitterService) {}

  async datHang(data: CreateOrderDto) {
    const order = await this.orderRepo.create(data);
    
    // Phát event — service khác tự xử lý
    await this.events.emitAsync('order.created', { order });
    
    return order;
  }
}
```

### Lắng Nghe Sự Kiện

```typescript
@Injectable()
export class NotificationService {
  @OnEvent('order.created')
  async khuiDonHang(payload: { order: Order }) {
    await this.guiEmail(payload.order.userId, 'Đặt hàng thành công!');
  }
}
```

::: tip Tránh memory leak
Dùng `eventEmitter.removeListeners(eventName)` hoặc `clearAllListeners()` để dọn dẹp listener — đặc biệt quan trọng trong test suite.
:::
