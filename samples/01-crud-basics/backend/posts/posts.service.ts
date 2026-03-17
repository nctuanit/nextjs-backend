import { Injectable, NotFoundException } from 'next-js-backend';

export interface Post {
  id: string;
  title: string;
  body: string;
  author: string;
  createdAt: string;
}

@Injectable()
export class PostsService {
  private posts: Post[] = [
    { id: '1', title: 'Hello World', body: 'First post body', author: 'Alice', createdAt: new Date().toISOString() },
    { id: '2', title: 'Second Post', body: 'Another post body', author: 'Bob', createdAt: new Date().toISOString() },
  ];

  findAll(author?: string): Post[] {
    return author ? this.posts.filter(p => p.author === author) : [...this.posts];
  }

  findOne(id: string): Post {
    const post = this.posts.find(p => p.id === id);
    if (!post) throw new NotFoundException(`Post #${id} not found`);
    return post;
  }

  create(data: { title: string; body: string; author: string }): Post {
    const post: Post = { id: crypto.randomUUID(), ...data, createdAt: new Date().toISOString() };
    this.posts.push(post);
    return post;
  }

  update(id: string, data: Partial<{ title: string; body: string }>): Post {
    const post = this.findOne(id);
    Object.assign(post, data);
    return post;
  }

  remove(id: string): { deleted: boolean; id: string } {
    const idx = this.posts.findIndex(p => p.id === id);
    if (idx === -1) throw new NotFoundException(`Post #${id} not found`);
    this.posts.splice(idx, 1);
    return { deleted: true, id };
  }
}
