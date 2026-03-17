import 'reflect-metadata';
import { Test } from 'next-js-backend';
import { AppModule } from '../08-session/backend/app.module';

async function main() {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = await moduleRef.createApp();
  
  // Dump the routes registered on the app
  console.log("Registered routes:");
  console.log(app.router.history.map(r => `${r.method} ${r.path}`));
}
main().catch(console.error);
