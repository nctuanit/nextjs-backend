import 'reflect-metadata';
import {
  Controller, Get, Post, Put, Delete,
  Param, Body, Query,
  UsePipes, UseFilters,
  HttpException, NotFoundException,
  Version,
} from 'next-js-backend';
import { ValidationPipe } from 'next-js-backend';
import { t } from 'elysia';
import { PostsService } from './posts.service';
import { CreatePostDto } from './create-post.dto';
import { HttpExceptionFilter } from './http-exception.filter';

// ─── V1: standard REST ──────────────────────────────────
@Controller('/posts')
@UseFilters(HttpExceptionFilter)
export class PostsV1Controller {
  constructor(private readonly posts: PostsService) {}

  /** GET /api/v1/posts?author=Alice */
  @Get()
  @Version('1')
  findAll(@Query('author') author?: string) {
    return this.posts.findAll(author);
  }

  /** GET /api/v1/posts/:id */
  @Get('/:id')
  @Version('1')
  findOne(@Param('id') id: string) {
    return this.posts.findOne(id);
  }

  /**
   * POST /api/posts
   * Demonstrates two validation strategies side by side:
   *   a) class-validator DTO via ValidationPipe
   *   b) TypeBox schema via t.Object() in @Body
   */
  @Post('/typebox')
  create_typebox(
    @Body(t.Object({ title: t.String({ minLength: 3 }), body: t.String(), author: t.String() }))
    body: { title: string; body: string; author: string },
  ) {
    return this.posts.create(body);
  }

  @Post('/dto')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  create_dto(@Body() dto: CreatePostDto) {
    return this.posts.create(dto);
  }

  /** PUT /api/v1/posts/:id */
  @Put('/:id')
  @Version('1')
  update(
    @Param('id') id: string,
    @Body(t.Object({ title: t.Optional(t.String()), body: t.Optional(t.String()) }))
    body: { title?: string; body?: string },
  ) {
    return this.posts.update(id, body);
  }

  /** DELETE /api/v1/posts/:id */
  @Delete('/:id')
  @Version('1')
  remove(@Param('id') id: string) {
    return this.posts.remove(id);
  }
}

// ─── V2: envelope response ───────────────────────────────
@Controller('/posts')
export class PostsV2Controller {
  constructor(private readonly posts: PostsService) {}

  @Get()
  @Version('2')
  findAll() {
    const data = this.posts.findAll();
    return { version: 2, count: data.length, items: data };
  }
}
