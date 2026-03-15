import { type DynamicModule } from '../interfaces';
import { MemoryCacheStore, type CacheStore } from './cache.store';
import { type Type, type ClassProvider, type ValueProvider } from '../di/provider';
import { CacheInterceptor } from './cache.interceptor';

export const CACHE_MANAGER = 'CACHE_MANAGER';
export const CACHE_MODULE_OPTIONS = 'CACHE_MODULE_OPTIONS';

export interface CacheModuleOptions {
  store?: CacheStore | Type<CacheStore>;
  ttl?: number; 
  max?: number;
}

export class CacheModule {
  static register(options?: CacheModuleOptions): DynamicModule {
    const defaultStore = new MemoryCacheStore();
    
    let storeProvider: ClassProvider | ValueProvider = {
      provide: CACHE_MANAGER,
      useValue: defaultStore,
    };

    if (options?.store) {
      if (typeof options.store === 'function') {
        storeProvider = {
          provide: CACHE_MANAGER,
          useClass: options.store,
        };
      } else {
        storeProvider = {
          provide: CACHE_MANAGER,
          useValue: options.store,
        };
      }
    }

    return {
      module: CacheModule,
      providers: [
        {
          provide: CACHE_MODULE_OPTIONS,
          useValue: options || {},
        },
        storeProvider,
        CacheInterceptor
      ],
      exports: [CACHE_MANAGER, CacheInterceptor],
    };
  }
}
