import 'reflect-metadata';
import { Module } from 'next-js-backend';
import { CacheModule, CompressionModule, DevModeModule, HealthModule } from 'next-js-backend';
import { CacheDemoModule } from './cache/cache-demo.module';
import { CompressionDemoModule } from './compression/compression-demo.module';
import { ThrottleDemoModule } from './throttle/throttle-demo.module';

@Module({
  imports: [
    CacheModule.register({ ttl: 10, max: 100 }),
    CompressionModule.register({ encoding: 'gzip', threshold: 512 }),
    DevModeModule.register({ enabled: true, maxHistory: 100 }),
    HealthModule,
    CacheDemoModule,
    CompressionDemoModule,
    ThrottleDemoModule,
  ],
})
export class AppModule {}
