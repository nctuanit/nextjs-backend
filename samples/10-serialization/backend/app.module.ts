import 'reflect-metadata';
import { Module } from 'next-js-backend';
import { UsersController } from './users/users.controller';

@Module({ controllers: [UsersController] })
export class AppModule {}
