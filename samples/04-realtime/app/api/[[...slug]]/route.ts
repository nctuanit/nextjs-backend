import { ElysiaFactory } from 'next-js-backend';
import { AppModule } from '../../../backend/app.module';

const { GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD } = ElysiaFactory.createNextJsHandlers(AppModule, { globalPrefix: '/api' });

export { GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD };
