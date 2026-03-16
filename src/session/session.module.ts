import { Module } from '../decorators/module.decorator';
import type { DynamicModule } from '../interfaces';
import { SessionService } from './session.service';
import { InMemorySessionStore, SessionStore } from './session.store';
import type { SessionModuleOptions } from './session.options';

export const SESSION_OPTIONS = 'SESSION_OPTIONS';
export const SESSION_STORE = 'SESSION_STORE';

@Module({})
export class SessionModule {
  static register(options: SessionModuleOptions = {}): DynamicModule {
    
    // Automatically fallback to In-Memory if none provided
    const storeProvider = options.store 
      ? typeof options.store === 'function'
        ? { provide: SESSION_STORE, useClass: options.store }
        : { provide: SESSION_STORE, useValue: options.store }
      : { provide: SESSION_STORE, useClass: InMemorySessionStore };

    return {
      module: SessionModule,
      providers: [
        {
          provide: SESSION_OPTIONS,
          useValue: options
        },
        // We ensure `storeProvider` binds to `SESSION_STORE` injection token
        // But SessionService constructor actually asks for `SessionStore` class generically.
        // We use a custom factory to wire the abstracted store token into the service.
        storeProvider ,
        {
          provide: SessionService,
          useFactory: (store: SessionStore, opts: SessionModuleOptions) => {
             return new SessionService(store, opts);
          },
          inject: [SESSION_STORE, SESSION_OPTIONS]
        }
      ],
      exports: [SessionService]
    };
  }
}
