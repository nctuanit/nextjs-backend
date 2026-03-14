import { Controller, Get, Post, Body, UsePipes, ValidationPipe } from 'next-js-backend';
import { CreateAdminDto } from './dto/create-admin.dto';

@Controller('/admins')
@UsePipes(new ValidationPipe()) 
export class AdminsController {
  @Post()
  createAdmin(@Body() dto: CreateAdminDto) {
    return {
      message: 'Admin created successfully',
      payload_received: dto,
      is_instance_of_dto: dto instanceof CreateAdminDto
    };
  }

  @Get()
  getAdmins() {
    return [{ id: 1, role: 'admin' }];
  }
}
