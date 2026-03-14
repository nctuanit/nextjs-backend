import { t } from 'elysia';
import { Controller, Get, Post, Param, Body, NotFoundException } from 'next-js-backend';
import { BooksService } from './books.service';

@Controller('/books')
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  @Get()
  getAllBooks() {
    return this.booksService.findAll();
  }

  @Get('/:id')
  getBookById(@Param('id', t.Numeric()) id: number) {
    return this.booksService.findOne(id);
  }

  @Post()
  createBook(
    @Body(
      t.Object({
        title: t.String(),
        author: t.String(),
      })
    )
    body: { title: string; author: string }
  ) {
    return this.booksService.create(body.title, body.author);
  }
}
