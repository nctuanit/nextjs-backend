import { Module } from 'next-js-backend';
import { CompressionDemoController } from './compression-demo.controller';

@Module({ controllers: [CompressionDemoController] })
export class CompressionDemoModule {}
