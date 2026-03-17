import 'reflect-metadata';
import { ElysiaFactory } from 'next-js-backend';
import { AppModule } from '../../../backend/app.module';

const handler = ElysiaFactory.createNextJsHandlers(AppModule, {
  globalPrefix: '/api',
  versioning: { type: 'uri' },
});

export const GET = handler.GET;
export const POST = handler.POST;
export const PUT = handler.PUT;
export const PATCH = handler.PATCH;
export const DELETE = handler.DELETE;
export const OPTIONS = handler.OPTIONS;
