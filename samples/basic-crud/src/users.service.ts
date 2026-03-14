import { Injectable, NotFoundException } from 'next-js-backend';

@Injectable()
export class UsersService {
  private users = [
    { id: 1, name: 'Alice', role: 'admin' },
    { id: 2, name: 'Bob', role: 'user' },
  ];

  findAll() {
    return this.users;
  }

  findOne(id: number) {
    const user = this.users.find((u) => u.id === id);
    if (!user) throw new NotFoundException(`User with ID ${id} not found`);
    return user;
  }

  create(name: string, role: string) {
    const newUser = { id: this.users.length + 1, name, role };
    this.users.push(newUser);
    return newUser;
  }
}
