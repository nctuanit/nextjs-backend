# Logger

The built-in `Logger` service provides structured, colored logging with context labels.

## Basic Usage

```typescript
import { Logger } from 'next-js-backend';

// Create with context name
const logger = new Logger('UserService');

logger.log('User created: u_123');
logger.warn('Session about to expire');
logger.error('Database connection failed', error.stack);
logger.debug('Resolving dependency: UserService');
logger.verbose('Incoming request headers', headers);
```

## In Services

```typescript
import { Injectable } from 'next-js-backend';
import { Logger } from 'next-js-backend';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  async findById(id: string) {
    this.logger.log(`Looking up user: ${id}`);
    const user = await this.repo.findById(id);
    if (!user) {
      this.logger.warn(`User not found: ${id}`);
      return null;
    }
    return user;
  }
}
```

## Log Levels

| Method | Level | Color |
|--------|-------|-------|
| `.log()` | INFO | Green |
| `.warn()` | WARN | Yellow |
| `.error()` | ERROR | Red |
| `.debug()` | DEBUG | Blue |
| `.verbose()` | VERBOSE | Cyan |

## Log Format

```
[2024-03-16 10:30:15] [UserService] ℹ User created: u_123
[2024-03-16 10:30:16] [AuthGuard] ⚠ Invalid token received
[2024-03-16 10:30:17] [DatabaseService] ✖ Connection refused
```

## Using in the Factory

The `ElysiaFactory` uses Logger internally for startup messages:

```
[ElysiaFactory] ℹ Registered route: GET /api/users
[ElysiaFactory] ℹ Application started on port 3000
```
