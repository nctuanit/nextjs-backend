import { Module } from 'next-js-backend';
import { ThrottleDemoController } from './throttle-demo.controller';

@Module({ controllers: [ThrottleDemoController] })
export class ThrottleDemoModule {}
