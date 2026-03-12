import { ElysiaFactory } from '../../index';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await ElysiaFactory.create(AppModule);

  app.listen(3002, () => {
      console.log(`🦊 Elysia Guards & Interceptors Sample running at http://${app.server?.hostname}:${app.server?.port}`);
      console.log('');
      console.log('1. Public Route (Logged by Interceptor):');
      console.log('GET http://localhost:3002/dashboard');
      console.log('');
      console.log('2. Private Route (Blocked by Guard):');
      console.log('GET http://localhost:3002/dashboard/private');
      console.log('');
      console.log('3. Private Route (Allowed by Guard):');
      console.log('GET http://localhost:3002/dashboard/private -H "Authorization: Bearer my-secret-token"');
  });
}

bootstrap();
