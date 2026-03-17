import 'reflect-metadata';
import { Module } from 'next-js-backend';
import { PipelineModule } from './pipeline/pipeline.module';

@Module({ imports: [PipelineModule] })
export class AppModule {}
