import { t } from 'elysia';
import { Controller, Get, Post, Param, Body } from 'next-js-backend';
import { UsersService } from './users.service';

@Controller('/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  getAllUsers() {
    return this.usersService.findAll();
  }

  @Get('/:id')
  getUserById(@Param('id', t.Numeric()) id: number) {
    return this.usersService.findOne(id);
  }

  @Post()
  createUser(
    @Body(
      t.Object({
        name: t.String(),
        role: t.Optional(t.String()),
      })
    )
    body: { name: string; role?: string }
  ) {
    return this.usersService.create(body.name, body.role || 'user');
  }
}
