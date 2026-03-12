import { describe, expect, it, beforeAll } from 'bun:test';
import { t } from 'elysia';
import { Controller, Get, Post, Body, Param, Query, Schema, ElysiaFactory } from '../../index';
import { UsePipes, ValidationPipe } from '../../index';
import { Module } from '../../index';
import { IsString, IsInt, Min } from 'class-validator';

class TestDto {
  @IsString()
  title!: string;

  @IsInt()
  @Min(10)
  quantity!: number;
}

@Controller('/validation')
class ValidationController {
  @Get('/schema/:id')
  @Schema({
    params: t.Object({ id: t.Numeric() })
  })
  getWithSchema(@Param('id') id: number) {
    return { id, type: typeof id };
  }

  @Post('/inline-body')
  postInline(@Body(t.Object({ tag: t.String() })) body: { tag: string }) {
    return body;
  }

  @Get('/inline-query')
  getInlineQuery(@Query('page', t.Numeric()) page: number) {
    return { page, type: typeof page };
  }

  @Post('/class-validator')
  @UsePipes(new ValidationPipe())
  postClassValidator(@Body() dto: TestDto) {
    return { success: true, dto, isInstance: dto instanceof TestDto };
  }
}

@Module({
  controllers: [ValidationController],
  providers: []
})
class ValidationModule {}

describe('E2E Validation & Schema Pipes', () => {
  let app: Awaited<ReturnType<typeof ElysiaFactory.create>>; 
  
  beforeAll(async () => {
    app = await ElysiaFactory.create(ValidationModule);
  });
  
  const req = (path: string, options?: RequestInit) => 
    app.handle(new Request(`http://localhost${path}`, options));

  it('should cast numeric params with @Schema decorator', async () => {
    const res = await req('/validation/schema/42');
    expect(await res.json()).toEqual({ id: 42, type: 'number' });
  });

  it('should reject invalid generic @Schema', async () => {
    const res = await req('/validation/schema/abc');
    expect(res.status).toBe(500); // Trigger typebox error
  });

  it('should validate inline @Body TypeBox definitions', async () => {
    const res = await req('/validation/inline-body', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tag: 'typescript' })
    });
    expect(await res.json()).toEqual({ tag: 'typescript' });
  });

  it('should reject invalid inline @Body with 500', async () => {
    const res = await req('/validation/inline-body', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wrongField: 'value' })
    });
    expect(res.status).toBe(500);
  });

  it('should validate inline @Query parameters', async () => {
    const res = await req('/validation/inline-query?page=5');
    expect(await res.json()).toEqual({ page: 5, type: 'number' });
  });

  it('should transform and validate with class-validator Custom ValidationPipe', async () => {
    const res = await req('/validation/class-validator', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Book', quantity: 20 })
    });
    expect(await res.json()).toEqual({ success: true, dto: { title: 'Book', quantity: 20 }, isInstance: true });
  });

  it('should throw HTTP exception on class-validator failure', async () => {
    const res = await req('/validation/class-validator', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Book', quantity: 1 }) // < 10
    });
    expect(res.status).toBe(400);
    expect(await res.text()).toContain('quantity must not be less than 10');
  });
});
