import { Controller, Get, Post, Body, Injectable } from 'next-js-backend';
import { TodosService } from './todos.service';

@Controller('/todos')
export class TodosController {
  constructor(private readonly todosService: TodosService) {}

  @Get('/')
  getAll() {
    return this.todosService.findAll();
  }

  @Post('/')
  create(@Body() body: { title: string }) {
    return this.todosService.create(body.title);
  }
}
