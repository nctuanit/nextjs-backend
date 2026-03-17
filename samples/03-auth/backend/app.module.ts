import 'reflect-metadata';
import { Module } from 'next-js-backend';
import { AuthModule } from './auth/auth.module';

@Module({ imports: [AuthModule] })
export class AppModule {}
