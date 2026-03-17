import { Injectable } from 'next-js-backend';
import { PasswordService } from 'next-js-backend';

export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
}

@Injectable()
export class UserStore {
  private users: User[] = [];

  async create(data: { email: string; name: string; password: string }): Promise<Omit<User, 'passwordHash'>> {
    const ps = new PasswordService();
    // PasswordService: Bun.password on Bun | bcryptjs on Node.js (auto-detected)
    const passwordHash = await ps.hash(data.password, { algorithm: 'bcrypt' });
    const user: User = { id: crypto.randomUUID(), email: data.email, name: data.name, passwordHash };
    this.users.push(user);
    const { passwordHash: _, ...safe } = user;
    return safe;
  }

  findByEmail(email: string): User | undefined {
    return this.users.find(u => u.email === email);
  }
}
