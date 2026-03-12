import { ElysiaFactory } from '../../index';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await ElysiaFactory.create(AppModule);

  app.listen(3001, () => {
      console.log(`🦊 Elysia Class-Validator Sample running at http://${app.server?.hostname}:${app.server?.port}`);
      console.log('Try sending an invalid POST request to trigger 400 Bad Request');
      console.log('POST http://localhost:3001/admins -d \'{"username": "Alice", "age": 12}\'');
  });
}

bootstrap();
