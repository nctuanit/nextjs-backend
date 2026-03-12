import { Module } from '../decorators/module.decorator';
import { type DynamicModule } from '../interfaces';
import { JwtService, type JwtModuleOptions } from './jwt.service';

@Module({})
export class JwtModule {
  /**
   * Bootstraps the JwtModule.
   * 
   * @param options Configuration options including signing secret and defaults
   */
  static register(options: JwtModuleOptions): DynamicModule {
    return {
      module: JwtModule,
      providers: [
        {
          provide: JwtService,
          useFactory: () => new JwtService(options),
        }
      ],
      exports: [JwtService]
    };
  }
}
