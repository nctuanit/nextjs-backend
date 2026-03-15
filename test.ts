import { Controller, Get, Post, Body, Param, Query, Schema } from './index';
import { t } from 'elysia';
import { Injectable } from './src/di/injectable.decorator';
import { ElysiaFactory } from './src/factory/elysia-factory';
import { Module } from './src/decorators/module.decorator';

@Injectable()
class UsersService {
    getHello() {
        return { message: 'Hello from UsersService!' };
    }
}

@Controller('/users')
class UsersController {
    constructor(private usersService: UsersService) {}

    @Get()
    getAllUsers() {
        return this.usersService.getHello();
    }

    @Get('/:id')
    @Schema({
        params: t.Object({
            id: t.Numeric() // Elysia automatically validates and parses numeric strings to JS numbers!
        })
    })
    getUserById(@Param('id') id: number) {
        return { id, name: 'User ' + id, typeOfId: typeof id };
    }

    @Post()
    createUser(@Body() body: Record<string, unknown>) {
        return { created: true, data: body };
    }

    @Get('/search')
    searchUsers(@Query('q') query: string) {
        return { searchingFor: query };
    }

    @Get('/context')
    rawContext(@Query('q') q: string) {
      return { q };
    }
}

@Module({
  controllers: [UsersController],
  providers: [UsersService]
})
class AppModule {}

async function bootstrap() {
  const app = await ElysiaFactory.create(AppModule);

  app.listen(3333, () => {
      console.log(`🦊 Elysia is running at http://${app.server?.hostname}:${app.server?.port}`);
  });
}

bootstrap();
