import { ElysiaFactory } from '../../index';
import { swagger } from '@elysiajs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await ElysiaFactory.create(AppModule);

  // Use the Swagger plugin
  app.use(swagger({
    documentation: {
      info: {
        title: 'Next-js-backend Swagger API Documentation',
        version: '1.0.0'
      }
    }
  }));

  app.listen(3003, () => {
    console.log(`🦊 Elysia Swagger Sample is running at http://${app.server?.hostname}:${app.server?.port}`);
    console.log(`📚 Swagger UI available at http://${app.server?.hostname}:${app.server?.port}/swagger`);
  });
}

bootstrap();
