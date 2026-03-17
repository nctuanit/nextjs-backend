import 'reflect-metadata';
import { Module } from 'next-js-backend';
import { PluginsModule, HealthModule } from 'next-js-backend';
import { ProductsModule } from './products/products.module';

@Module({
  imports: [
    // PluginsModuleOptions: cors, helmet — swagger is NOT a built-in option
    // Swagger/OpenAPI is enabled via Elysia's @elysiajs/swagger plugin directly
    PluginsModule.register({ cors: true }),
    HealthModule,
    ProductsModule,
  ],
})
export class AppModule {}
