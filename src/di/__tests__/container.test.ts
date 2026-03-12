import { describe, expect, it } from 'bun:test';
import { Container } from '../container';
import { Injectable } from '../injectable.decorator';
import { Inject } from '../inject.decorator';

@Injectable()
class ConfigService {
  constructor() {}
  get(key: string): string | null { return key === 'DB_URL' ? 'postgres://localhost' : null; }
}

@Injectable()
class DatabaseService {
  constructor(private configService: ConfigService) {}
  connect() { return this.configService.get('DB_URL'); }
}

class TokenBasedService {
  constructor(@Inject('CONNECTION_STRING') private dbUrl: string) {}
  getUrl() { return this.dbUrl; }
}

describe('DI Container Advanced Providers Map', () => {

  it('should resolve standard class providers via type parameters', async () => {
    const container = new Container();
    container.addProviders([ConfigService, DatabaseService]);
    
    // Test resolution of tree
    const db = await container.resolve<DatabaseService>(DatabaseService);
    expect(db).toBeInstanceOf(DatabaseService);
    expect(db.connect()).toBe('postgres://localhost');
    
    // Test singleton instantiation
    const db2 = await container.resolve<DatabaseService>(DatabaseService);
    expect(db).toBe(db2);
  });

  it('should resolve `useValue` providers including plain strings', async () => {
    const container = new Container();
    container.addProviders([
      { provide: 'CONNECTION_STRING', useValue: 'mysql://remote' },
      TokenBasedService
    ]);
    
    const service = await container.resolve<TokenBasedService>(TokenBasedService);
    expect(service.getUrl()).toBe('mysql://remote');
    
    const token = await container.resolve<string>('CONNECTION_STRING');
    expect(token).toBe('mysql://remote');
  });

  it('should resolve `useFactory` async providers', async () => {
    const container = new Container();
    container.addProviders([
      { provide: 'API_KEY', useValue: 'secret-123' },
      { 
        provide: 'ASYNC_DB', 
        useFactory: async (apiKey: string) => {
          // Simulate latency
          await new Promise(r => setTimeout(r, 10));
          return `connected_via_${apiKey}`;
        },
        inject: ['API_KEY']
      }
    ]);
    
    const dbClient = await container.resolve<string>('ASYNC_DB');
    expect(dbClient).toBe('connected_via_secret-123');
  });

  it('should resolve `useClass` overrides (Polymorphism)', async () => {
    class MockConfigService extends ConfigService {
      override get(key: string) { return 'mocked://url'; }
    }

    const container = new Container();
    container.addProviders([
      { provide: ConfigService, useClass: MockConfigService },
      DatabaseService
    ]);
    
    const db = await container.resolve<DatabaseService>(DatabaseService);
    expect(db.connect()).toBe('mocked://url');
  });

  it('should resolve `useExisting` aliases', async () => {
    const container = new Container();
    container.addProviders([
      { provide: 'OriginalToken', useValue: 'OriginalData' },
      { provide: 'AliasToken', useExisting: 'OriginalToken' }
    ]);
    
    const data = await container.resolve<string>('AliasToken');
    expect(data).toBe('OriginalData');
  });

  it('should throw an error for unprovided custom Injection tokens', async () => {
    const container = new Container();
    container.addProviders([TokenBasedService]);
    
    expect(container.resolve(TokenBasedService))
      .rejects
      .toThrow('Cannot resolve dependency: CONNECTION_STRING');
  });
});
