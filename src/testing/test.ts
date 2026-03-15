import 'reflect-metadata';
import { type Type, type Provider, type InjectionToken } from '../di/provider';
import { Container } from '../di/container';
import { MODULE_METADATA } from '../constants';
import { ElysiaFactory } from '../factory/elysia-factory';

/**
 * TestingModule provides an isolated DI container for unit testing.
 * 
 * @example
 * ```ts
 * const module = await Test.createTestingModule({
 *   controllers: [UserController],
 *   providers: [UserService],
 * }).compile();
 * 
 * const service = await module.get(UserService);
 * expect(service.findAll()).toEqual([...]);
 * ```
 */
export class TestingModule {
  private container: Container;
  private controllers: Type<unknown>[];
  private providers: Provider[];
  private overrides: Map<InjectionToken, Provider> = new Map();

  constructor(
    controllers: Type<unknown>[],
    providers: Provider[],
  ) {
    this.container = new Container();
    this.controllers = controllers;
    this.providers = providers;
  }

  /**
   * Override a provider with a mock/stub value.
   */
  overrideProvider(token: InjectionToken): { useValue: (value: unknown) => TestingModule; useClass: (cls: Type<unknown>) => TestingModule } {
    return {
      useValue: (value: unknown) => {
        this.overrides.set(token, { provide: token, useValue: value });
        return this;
      },
      useClass: (cls: Type<unknown>) => {
        this.overrides.set(token, { provide: token, useClass: cls });
        return this;
      },
    };
  }

  /**
   * Compile the testing module — registers all providers in the container.
   */
  async compile(): Promise<TestingModule> {
    // Build final providers with overrides applied
    const finalProviders: Provider[] = this.providers.map(p => {
      const token = typeof p === 'function' ? p : (p as { provide: InjectionToken }).provide;
      return this.overrides.has(token) ? this.overrides.get(token)! : p;
    });

    // Add controllers as class providers
    for (const ctrl of this.controllers) {
      finalProviders.push(ctrl);
    }

    this.container.addProviders(finalProviders);

    return this;
  }

  /**
   * Get a resolved instance from the testing container.
   */
  async get<T>(token: Type<T> | string | symbol): Promise<T> {
    return this.container.resolve(token as InjectionToken) as Promise<T>;
  }

  /**
   * Create a real Elysia app for integration testing (HTTP calls).
   */
  async createApp() {
    const controllers = this.controllers;
    const providers: Provider[] = this.providers.map(p => {
      const token = typeof p === 'function' ? p : (p as { provide: InjectionToken }).provide;
      return this.overrides.has(token) ? this.overrides.get(token)! : p;
    });

    // Dynamically create a module
    class TestModule {}
    Reflect.defineMetadata(MODULE_METADATA.CONTROLLERS, controllers, TestModule);
    Reflect.defineMetadata(MODULE_METADATA.PROVIDERS, providers, TestModule);
    Reflect.defineMetadata(MODULE_METADATA.IMPORTS, [], TestModule);
    Reflect.defineMetadata(MODULE_METADATA.EXPORTS, [], TestModule);

    return ElysiaFactory.create(TestModule);
  }
}

/**
 * Test utility for creating isolated testing modules.
 * 
 * @example
 * ```ts
 * const module = await Test.createTestingModule({
 *   providers: [UserService],
 * }).compile();
 * 
 * const service = await module.get(UserService);
 * ```
 */
export class Test {
  static createTestingModule(metadata: {
    controllers?: Type<unknown>[];
    providers?: Provider[];
  }): TestingModule {
    return new TestingModule(
      metadata.controllers || [],
      metadata.providers || [],
    );
  }
}
