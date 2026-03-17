import 'reflect-metadata';
import { Module } from 'next-js-backend';
import { PostsModule } from './posts/posts.module';

@Module({ imports: [PostsModule] })
export class AppModule {}
