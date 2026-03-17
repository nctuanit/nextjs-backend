/**
 * Testing Utilities Tests
 *
 * Tests Test.createTestingModule(), overrideProvider(), compile(), createApp().
 */
import { describe, test, expect } from 'bun:test';
import 'reflect-metadata';

import { Test } from '../../src/testing';
import { Injectable } from '../../src/di/injectable.decorator';
import { Controller, Get, Module } from '../../index';
import { TestRequestBuilder } from '../../src/testing/request-builder';


// ═══════════════════════════════════════════════════════════════════
// createTestingModule
// ═══════════════════════════════════════════════════════════════════

describe('Testing > createTestingModule', () => {
  test('should compile a module and resolve providers', async () => {
    @Injectable()
    class UserService {
      findAll() { return [{ id: 1, name: 'Alice' }]; }
    }

    const module = await Test.createTestingModule({
      providers: [UserService],
    }).compile();

    const service = await module.get(UserService);
    expect(service).toBeDefined();
    expect(service.findAll()).toEqual([{ id: 1, name: 'Alice' }]);
  });

  test('should override provider with useValue', async () => {
    @Injectable()
    class UserService {
      findAll() { return [{ id: 1 }]; }
    }

    const mockService = { findAll: () => [{ id: 99 }] };

    const module = await Test.createTestingModule({
      providers: [UserService],
    })
      .overrideProvider(UserService).useValue(mockService)
      .compile();

    const service = await module.get(UserService);
    expect(service.findAll()).toEqual([{ id: 99 }]);
  });

  test('should resolve multiple providers', async () => {
    @Injectable()
    class ServiceA { getA() { return 'a'; } }

    @Injectable()
    class ServiceB { getB() { return 'b'; } }

    const module = await Test.createTestingModule({
      providers: [ServiceA, ServiceB],
    }).compile();

    const a = await module.get(ServiceA);
    const b = await module.get(ServiceB);
    expect(a.getA()).toBe('a');
    expect(b.getB()).toBe('b');
  });
});

// ═══════════════════════════════════════════════════════════════════
// createApp
// ═══════════════════════════════════════════════════════════════════

describe('Testing > createApp', () => {
  test('should create an app that handles HTTP requests', async () => {
    @Injectable()
    class TodoService {
      findAll() { return [{ id: 1, title: 'Todo' }]; }
    }

    @Controller('/todos')
    class TodoController {
      constructor(private readonly svc: TodoService) {}
      @Get() getAll() { return this.svc.findAll(); }
    }

    const module = await Test.createTestingModule({
      controllers: [TodoController],
      providers: [TodoService],
    }).compile();

    const app = await module.createApp();
    const res = await app.handle(new TestRequestBuilder().path('/todos').build());

    expect(res.status).toBe(200);
    const data = await res.json() ;
    expect(data).toEqual([{ id: 1, title: 'Todo' }]);
  });

  test('should work with overridden providers in HTTP context', async () => {
    @Injectable()
    class DataService {
      getData() { return 'real'; }
    }

    @Controller('/data')
    class DataCtrl {
      constructor(private readonly svc: DataService) {}
      @Get() get() { return { value: this.svc.getData() }; }
    }

    const module = await Test.createTestingModule({
      controllers: [DataCtrl],
      providers: [DataService],
    })
      .overrideProvider(DataService).useValue({ getData: () => 'mocked' })
      .compile();

    const app = await module.createApp();
    const res = await app.handle(new TestRequestBuilder().path('/data').build());
    const data = await res.json() ;
    expect(data.value).toBe('mocked');
  });
});
