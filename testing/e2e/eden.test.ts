import { describe, test, expect } from 'bun:test';
import 'reflect-metadata';
import { treaty } from '@elysiajs/eden';

import { Controller, Get, Post, Body, Injectable, Module } from '../../index';
import { ElysiaFactory } from '../../src/factory/elysia-factory';

@Injectable()
class ItemsService {
  private items = [
    { id: 1, name: 'Item A' },
    { id: 2, name: 'Item B' },
  ];

  findAll() {
    return this.items;
  }

  create(name: string) {
    const item = { id: this.items.length + 1, name };
    this.items.push(item);
    return item;
  }
}

@Controller('/items')
class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  @Get('/')
  getAll() {
    return this.itemsService.findAll();
  }

  @Post('/')
  create(@Body() body: { name: string }) {
    return this.itemsService.create(body.name);
  }
}

@Module({
  controllers: [ItemsController],
  providers: [ItemsService],
})
class TestModule {}

describe('Eden Treaty Integration', () => {
  test('should call GET /items via Eden Treaty', async () => {
    const app = await ElysiaFactory.create(TestModule);
    app.listen(4510);

    try {
      const api = treaty<typeof app>('http://localhost:4510');
      const response = await api.items.get();

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
    } finally {
      app.stop();
    }
  });

  test('should call POST /items via Eden Treaty', async () => {
    const app = await ElysiaFactory.create(TestModule);
    app.listen(4511);

    try {
      const api = treaty<typeof app>('http://localhost:4511');
      const response = await api.items.post({ name: 'Item C' });

      expect(response.status).toBe(200);
      expect((response.data ).name).toBe('Item C');
    } finally {
      app.stop();
    }
  });
});
