import { Injectable } from 'next-js-backend';

@Injectable()
export class TodosService {
  private todos = [
    { id: 1, title: 'Learn Elysia', done: false },
    { id: 2, title: 'Build API', done: true },
  ];

  findAll() {
    return this.todos;
  }

  create(title: string) {
    const todo = { id: this.todos.length + 1, title, done: false };
    this.todos.push(todo);
    return todo;
  }
}
