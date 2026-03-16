import { describe, expect, it, beforeAll } from 'bun:test';
import { Controller, Get, ElysiaFactory, Injectable } from '../../index';
import { Module } from '../../index';
import { DynamicModule } from '../../src/interfaces';

@Injectable()
class RandomizerService {
  private hash: string;
  constructor() {
    this.hash = Math.random().toString(36).substring(7);
  }
  getHash() {
    return this.hash;
  }
}

@Injectable()
class ConfigProvider {
  constructor() {}
  getDbUrl() {
    return 'postgres://default';
  }
}

@Injectable()
class DeepConfigProvider {
  getFeatureFlag() {
    return true;
  }
}

class InnerDynamicModule {
  static forRoot(): DynamicModule {
    return {
      module: InnerDynamicModule,
      providers: [DeepConfigProvider]
    };
  }
}

class OuterDynamicModule {
  static register(): DynamicModule {
    return {
      module: OuterDynamicModule,
      imports: [InnerDynamicModule.forRoot()]
    };
  }
}

@Controller('/di')
class DIController {
  // Test constructor injection
  constructor(
    private randomizer: RandomizerService,
    private config: ConfigProvider,
    private deepConfig: DeepConfigProvider
  ) {}

  @Get()
  getServicesData() {
    return {
      hash: this.randomizer.getHash(),
      db: this.config.getDbUrl(),
      featureEnabled: this.deepConfig.getFeatureFlag()
    };
  }
}

@Module({
  imports: [OuterDynamicModule.register()],
  controllers: [DIController],
  providers: [
    { provide: RandomizerService, useClass: RandomizerService },
    { provide: ConfigProvider, useValue: { getDbUrl: () => 'mysql://custom_injection' } } // Mock override via useValue
  ]
})
class DIModule {}

describe('E2E Dependency Injection (ElysiaFactory)', () => {
  let app: Awaited<ReturnType<typeof ElysiaFactory.create>>; 
  
  beforeAll(async () => {
    app = await ElysiaFactory.create(DIModule);
  });
  
  const req = (path: string, options?: RequestInit) => 
    app.handle(new Request(`http://localhost${path}`, options));

  it('should correctly build dependencies inside ElysiaFactory via globalContainer', async () => {
    const res = await req('/di');
    expect(res.status).toBe(200);
    const data = await res.json() ;
    
    // RandomService should output a hash
    expect(data.hash).toBeDefined();
    
    // ConfigProvider was overridden in @Module providers! UseValue injected mock behavior
    expect(data.db).toBe('mysql://custom_injection');

    // DeepConfigProvider is resolved from a deeply nested DynamicModule imports hierarchy
    expect(data.featureEnabled).toBe(true);
  });
});
