# Exception Filters

Exception filters handle errors thrown during request processing. They control the response format when exceptions occur.

## Built-in Exceptions

All exceptions extend `HttpException`:

```typescript
import {
  BadRequestException,      // 400
  UnauthorizedException,    // 401
  ForbiddenException,       // 403
  NotFoundException,        // 404
  ConflictException,        // 409
  UnprocessableEntityException, // 422
  InternalServerErrorException, // 500
  HttpException,
} from 'next-js-backend';

@Get('/:id')
findOne(@Param('id') id: string) {
  const user = this.service.findOne(id);
  if (!user) throw new NotFoundException(`User #${id} not found`);
  return user;
}
```

## Custom Exceptions

```typescript
import { HttpException } from 'next-js-backend';

export class PaymentRequiredException extends HttpException {
  constructor(message = 'Payment required') {
    super(message, 402);
  }
}

export class TooManyRequestsException extends HttpException {
  constructor(retryAfter: number) {
    super(
      { message: 'Too many requests', retryAfter },
      429,
    );
  }
}
```

## Exception Filters

Create custom filters with `@Catch`:

```typescript
import { Catch, type ExceptionFilter } from 'next-js-backend';
import type { Context } from 'elysia';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, context: Context) {
    const status = exception.getStatus();
    const message = exception.getMessage();

    return new Response(
      JSON.stringify({
        statusCode: status,
        message,
        timestamp: new Date().toISOString(),
        path: new URL(context.request.url).pathname,
      }),
      {
        status,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
}
```

## Applying Filters

```typescript
import { UseFilters } from 'next-js-backend';

@Post('/')
@UseFilters(HttpExceptionFilter)
create(@Body() dto: CreateDto) {
  // ...
}

// Controller-level
@Controller('/users')
@UseFilters(HttpExceptionFilter)
export class UserController { ... }
```

## Global Filters

Global error handling is built into the factory — all unhandled exceptions return a structured JSON error response by default.

## Validation Errors

The built-in `ValidationPipe` throws a structured `400` with field-level errors:

```json
{
  "statusCode": 400,
  "message": ["name must be a string", "email must be an email"],
  "error": "Bad Request"
}
```
