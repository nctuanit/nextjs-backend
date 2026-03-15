import 'reflect-metadata';
import { type Provider, type InjectionToken, type Type } from './provider';

// Internal type to keep track of provider definitions
type ProviderWrapper = {
  isResolved: boolean;
  instance: unknown;
  provider: Provider;
};

export class Container {
  // Store raw providers and their resolved instances by Token
  private providers = new Map<InjectionToken, ProviderWrapper>();
  // Track tokens currently being resolved to detect circular dependencies
  private resolving = new Set<InjectionToken>();

  /**
   * Clears all registered providers and singletons.
   * Useful for test isolation.
   */
  clear() {
    this.providers.clear();
  }

  /**
   * Register an array of providers into this container.
   */
  addProviders(providers: Provider[]) {
    for (const provider of providers) {
      if (typeof provider === 'function') {
        // Standard class provider
        this.providers.set(provider, { isResolved: false, instance: null, provider });
      } else {
        // Custom provider (useValue, useFactory, useClass, useExisting)
        this.providers.set(provider.provide, { isResolved: false, instance: null, provider });
      }
    }
  }

  /**
   * Resolve a token into an instance.
   */
  async resolve<T>(token: InjectionToken): Promise<T> {
    const wrapper = this.providers.get(token);

    // If perfectly registered provider exists
    if (wrapper) {
      if (wrapper.isResolved) {
        return wrapper.instance as T;
      }

      // Circular dependency detection
      if (this.resolving.has(token)) {
        const tokenName = typeof token === 'function' ? token.name : String(token);
        throw new Error(
          `Circular dependency detected while resolving "${tokenName}". ` +
          `Check your provider dependency graph.`,
        );
      }

      this.resolving.add(token);
      try {
        const p = wrapper.provider;

        if (typeof p === 'function') {
           wrapper.instance = await this.instantiateClass(p);
        } else if ('useValue' in p) {
           wrapper.instance = p.useValue;
        } else if ('useFactory' in p) {
           const injections = p.inject ? await Promise.all(p.inject.map(t => this.resolve(t))) : [];
           wrapper.instance = await p.useFactory(...injections);
        } else if ('useClass' in p) {
           wrapper.instance = await this.instantiateClass(p.useClass);
        } else if ('useExisting' in p) {
           wrapper.instance = await this.resolve(p.useExisting);
        }

        wrapper.isResolved = true;
      } finally {
        this.resolving.delete(token);
      }
      return wrapper.instance as T;
    }

    // Fallback: If token directly is a class but not explicitly provided, try to instantiate it (matching old behavior)
    if (typeof token === 'function') {
      return this.instantiateClass(token as Type<any>);
    }

    throw new Error(`Cannot resolve dependency: ${String(token)}. Make sure it is provided in the Module.`);
  }

  /**
   * Instantiates a class by injecting its constructor arguments
   */
  private async instantiateClass<T>(target: Type<T>): Promise<T> {
    // Get typescript design param types
    const tokens = Reflect.getMetadata('design:paramtypes', target) || [];
    
    // Get custom @Inject() overrides
    const customInjections: { index: number, token: InjectionToken }[] = Reflect.getMetadata('custom:inject', target) || [];

    // Resolve all dependencies
    const injections = await Promise.all(tokens.map((token: InjectionToken, index: number) => {
      const customInjection = customInjections.find(ci => ci.index === index);
      const resolveToken = customInjection ? customInjection.token : token;
      return this.resolve(resolveToken);
    }));
    
    return new target(...injections);
  }
}

export const globalContainer = new Container();
