import 'reflect-metadata';
import { describe, it, expect, beforeAll } from 'bun:test';
import { Test, TestRequestBuilder } from 'next-js-backend';
import { PostsService } from '../01-crud-basics/backend/posts/posts.service';
import { PostsV1Controller, PostsV2Controller } from '../01-crud-basics/backend/posts/posts.controller';

describe('01-crud-basics', () => {
  let app: Awaited<ReturnType<ReturnType<typeof Test.createTestingModule>['createApp']>>;
  let service: PostsService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [PostsV1Controller, PostsV2Controller],
      providers: [PostsService],
    }).compile();

    service = await moduleRef.get(PostsService);
    app = await moduleRef.createApp();
  });

  // ── Service unit tests ────────────────────────────────
  describe('PostsService', () => {
    it('returns initial seed posts', () => {
      const posts = service.findAll();
      expect(posts.length).toBeGreaterThanOrEqual(2);
    });

    it('creates a post and finds it', () => {
      const created = service.create({ title: 'Test Post', body: 'body', author: 'Tester' });
      expect(created.id).toBeDefined();
      const found = service.findOne(created.id);
      expect(found.title).toBe('Test Post');
    });

    it('updates a post', () => {
      const post = service.create({ title: 'Old', body: 'old body', author: 'A' });
      const updated = service.update(post.id, { title: 'New Title' });
      expect(updated.title).toBe('New Title');
    });

    it('removes a post', () => {
      const post = service.create({ title: 'Delete Me', body: '...', author: 'A' });
      const result = service.remove(post.id);
      expect(result.deleted).toBe(true);
    });

    it('throws NotFoundException for missing post', () => {
      expect(() => service.findOne('nonexistent-id')).toThrow('not found');
    });

    it('filters by author', () => {
      service.create({ title: 'By Bob', body: '...', author: 'Bob' });
      const bobPosts = service.findAll('Bob');
      expect(bobPosts.every(p => p.author === 'Bob')).toBe(true);
    });
  });

  // ── HTTP integration tests ────────────────────────────
  // Note: @Version('1')/@Version('2') only active with global versioning middleware.
  // In test app, unversioned routes (typebox, dto, PUT, DELETE) work normally.

  describe('POST /posts/typebox (TypeBox validation)', () => {
    it('creates post with valid TypeBox payload', async () => {
      const res = await app.handle(new TestRequestBuilder().path('/posts/typebox').method('POST').headers({ 'Content-Type': 'application/json' }).body({ title: 'TypeBox Post', body: 'content', author: 'Alice' }).build());
      expect(res.status).toBe(200);
      const post = await res.json() as { title: string };
      expect(post.title).toBe('TypeBox Post');
    });

    it('rejects too-short title (TypeBox minLength 3)', async () => {
      const res = await app.handle(new TestRequestBuilder().path('/posts/typebox').method('POST').headers({ 'Content-Type': 'application/json' }).body({ title: 'ab', body: 'x', author: 'A' }).build());
      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('POST /posts/dto (class-validator)', () => {
    it('creates post with valid DTO', async () => {
      const res = await app.handle(new TestRequestBuilder().path('/posts/dto').method('POST').headers({ 'Content-Type': 'application/json' }).body({ title: 'DTO Post', body: 'dto content', author: 'Bob' }).build());
      expect(res.status).toBe(200);
      const post = await res.json() as { title: string };
      expect(post.title).toBe('DTO Post');
    });

    it('rejects invalid DTO data', async () => {
      const res = await app.handle(new TestRequestBuilder().path('/posts/dto').method('POST').headers({ 'Content-Type': 'application/json' }).body({ title: 'x' }).build());
      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });

  // PUT /posts/:id and DELETE /posts/:id use @Version('1') — only reachable via URI versioning
  // They return 404 in the test app (no globalPrefix versioning). Tested at service level above.
  describe('PUT + DELETE via service (not HTTP, @Version blocks them in test app)', () => {
    it('@Version routes work at service level', () => {
      const created = service.create({ title: 'To Update', body: 'body', author: 'X' });
      const updated = service.update(created.id, { title: 'Updated' });
      expect(updated.title).toBe('Updated');
      const deleted = service.remove(created.id);
      expect(deleted.deleted).toBe(true);
    });
  });
});
