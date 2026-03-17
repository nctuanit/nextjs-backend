import 'reflect-metadata';
import { Controller, Get, Post, Param, Body, Query } from 'next-js-backend';
import { t } from 'elysia';
import { ProductsService } from './products.service';

/**
 * ProductsController — documented with TypeBox schemas
 * Swagger UI at GET /api/swagger shows full OpenAPI spec
 */
@Controller('/products')
export class ProductsController {
  constructor(private readonly svc: ProductsService) {}

  @Get()
  findAll(@Query('category') category?: string) {
    return this.svc.findAll(category);
  }

  @Get('/:id')
  findOne(@Param('id') id: string) {
    return this.svc.findOne(id);
  }

  @Post()
  create(
    @Body(t.Object({
      name: t.String({ description: 'Product name', minLength: 2 }),
      price: t.Number({ description: 'Price in USD', minimum: 0 }),
      category: t.String({ description: 'Product category' }),
    }))
    body: { name: string; price: number; category: string },
  ) {
    return this.svc.create(body);
  }
}
