import { ElysiaFactory } from '../../index';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await ElysiaFactory.create(AppModule);

  app.listen(3000, () => {
      console.log(`🦊 Elysia Basic CRUD Sample is running at http://${app.server?.hostname}:${app.server?.port}`);
      console.log('Try querying:');
      console.log('GET http://localhost:3000/users');
      console.log('GET http://localhost:3000/users/1');
      console.log('POST http://localhost:3000/users -d \'{"name": "Charlie"}\'');
  });
}

bootstrap();
