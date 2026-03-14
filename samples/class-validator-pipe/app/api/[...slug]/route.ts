import { ElysiaFactory } from 'next-js-backend';
import { AppModule } from '../../../src/app.module';

export const { GET, POST, PUT, PATCH, DELETE } = ElysiaFactory.createNextJsHandlers(AppModule, {
  globalPrefix: '/api',
});
