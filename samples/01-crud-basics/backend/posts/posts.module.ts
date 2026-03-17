import { Module } from 'next-js-backend';
import { CacheModule } from 'next-js-backend';
import { PostsService } from './posts.service';
import { PostsV1Controller, PostsV2Controller } from './posts.controller';

@Module({
  imports: [CacheModule.register({ ttl: 30, max: 50 })],
  controllers: [PostsV1Controller, PostsV2Controller],
  providers: [PostsService],
})
export class PostsModule {}
