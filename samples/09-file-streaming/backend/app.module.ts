import 'reflect-metadata';
import { Module } from 'next-js-backend';
import { FilesController } from './files/files.controller';

@Module({
  controllers: [FilesController],
})
export class AppModule {}
