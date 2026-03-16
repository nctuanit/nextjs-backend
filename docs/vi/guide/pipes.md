# Pipes

Pipes transform and validate input data before it reaches the route handler. They run after parameter decorators extract values.

## Built-in: ValidationPipe

The most commonly used pipe — validates request body against a DTO class using `class-validator`:

```typescript
import { ValidationPipe } from 'next-js-backend';
import { IsString, IsEmail, MinLength } from 'class-validator';

// DTO
class CreateUserDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @MinLength(8)
  password: string;
}

// Apply to route
@Post('/')
@UsePipes(new ValidationPipe())
create(@Body() dto: CreateUserDto) {
  return this.userService.create(dto);
}
```

If validation fails, the pipe throws a `400 Bad Request` with field-level error details.

## Global Validation

Apply globally in your factory:

```typescript
import { ElysiaFactory, ValidationPipe } from 'next-js-backend';

const app = await ElysiaFactory.create(AppModule);
// Register globally via module provider
```

## TypeBox Schema Validation

Use TypeBox schemas directly with `@Body`:

```typescript
import { t } from 'elysia';

@Post('/')
create(@Body(t.Object({
  name: t.String({ minLength: 1 }),
  email: t.String({ format: 'email' }),
  age: t.Number({ minimum: 18 }),
})) body: { name: string; email: string; age: number }) {
  return this.service.create(body);
}
```

## Creating a Custom Pipe

Implement the `PipeTransform` interface:

```typescript
import { Injectable, type PipeTransform } from 'next-js-backend';

@Injectable()
export class ParseIntPipe implements PipeTransform<string, number> {
  transform(value: string): number {
    const parsed = parseInt(value, 10);
    if (isNaN(parsed)) {
      throw new BadRequestException(`"${value}" is not a valid integer`);
    }
    return parsed;
  }
}

// Usage
@Get('/:id')
findOne(@Param('id', ParseIntPipe) id: number) {}
```

## Type Coercion

Pipe context includes `metatype` for type-aware conversion:

```typescript
@Injectable()
export class ParseBoolPipe implements PipeTransform {
  transform(value: unknown, metadata: ArgumentMetadata) {
    if (value === 'true') return true;
    if (value === 'false') return false;
    throw new BadRequestException('Expected boolean string');
  }
}
```

## Applying Pipes

```typescript
// Parameter-level
@Get('/:id')
findOne(@Param('id', ParseIntPipe) id: number) {}

// Route-level
@Post('/')
@UsePipes(ValidationPipe)
create(@Body() dto: CreateDto) {}
```
