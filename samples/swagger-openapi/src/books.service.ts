import { Injectable } from 'next-js-backend';

@Injectable()
export class BooksService {
  private books = [
    { id: 1, title: 'The Great Gatsby', author: 'F. Scott Fitzgerald' },
    { id: 2, title: '1984', author: 'George Orwell' },
  ];

  findAll() {
    return this.books;
  }

  findOne(id: number) {
    return this.books.find((b) => b.id === id);
  }

  create(title: string, author: string) {
    const newBook = { id: this.books.length + 1, title, author };
    this.books.push(newBook);
    return newBook;
  }
}
