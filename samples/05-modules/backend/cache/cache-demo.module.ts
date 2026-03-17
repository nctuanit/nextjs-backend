import { Module } from 'next-js-backend';
import { CacheDemoController } from './cache-demo.controller';

@Module({ controllers: [CacheDemoController] })
export class CacheDemoModule {}
