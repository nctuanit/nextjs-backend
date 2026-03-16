import { describe, test, expect } from 'bun:test';
import 'reflect-metadata';

import { Controller, Get, Post, Body, Injectable, Module } from '../../index';
import { Test } from '../../src/testing/test';

// ─── Test fixtures ───────────────────────────────────────────────

@Injectable()
class CatsService {
  private cats = [
    { id: 1, name: 'Tom' },
    { id: 2, name: 'Jerry' },
  ];

  findAll() {
    return this.cats;
  }

  create(name: string) {
    const cat = { id: this.cats.length + 1, name };
    this.cats.push(cat);
    return cat;
  }
}

@Controller('/cats')
class CatsController {
  constructor(private readonly catsService: CatsService) {}

  @Get('/')
  findAll() {
    return this.catsService.findAll();
  }

  @Post('/')
  create(@Body() body: { name: string }) {
    return this.catsService.create(body.name);
  }
}

// ─── Tests ───────────────────────────────────────────────────────

describe('Test.createTestingModule()', () => {
  test('should resolve a provider from the testing module', async () => {
    const module = await Test.createTestingModule({
      providers: [CatsService],
    }).compile();

    const service = await module.get(CatsService);
    expect(service).toBeInstanceOf(CatsService);
    expect(service.findAll()).toEqual([
      { id: 1, name: 'Tom' },
      { id: 2, name: 'Jerry' },
    ]);
  });

  test('should override a provider with useValue', async () => {
    const mockService = {
      findAll: () => [{ id: 99, name: 'MockCat' }],
      create: (name: string) => ({ id: 100, name }),
    };

    const module = await Test.createTestingModule({
      controllers: [CatsController],
      providers: [CatsService],
    })
      .overrideProvider(CatsService).useValue(mockService)
      .compile();

    const service = await module.get(CatsService);
    expect(service.findAll()).toEqual([{ id: 99, name: 'MockCat' }]);
  });

  test('should create a real app for integration testing', async () => {
    const module = await Test.createTestingModule({
      controllers: [CatsController],
      providers: [CatsService],
    }).compile();

    const app = await module.createApp();

    const response = await app.handle(new Request('http://localhost/cats'));
    expect(response.status).toBe(200);

    const data = await response.json() ;
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThanOrEqual(2);
  });

  test('should create app with mocked provider for integration testing', async () => {
    const module = await Test.createTestingModule({
      controllers: [CatsController],
      providers: [CatsService],
    })
      .overrideProvider(CatsService).useValue({
        findAll: () => [{ id: 1, name: 'OnlyMock' }],
        create: () => ({ id: 2, name: 'Created' }),
      })
      .compile();

    const app = await module.createApp();

    const response = await app.handle(new Request('http://localhost/cats'));
    expect(response.status).toBe(200);

    const data = await response.json() ;
    expect(data).toEqual([{ id: 1, name: 'OnlyMock' }]);
  });
});
