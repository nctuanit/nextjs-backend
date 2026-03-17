import 'reflect-metadata';
import {
  Controller, Post, Get, Body, Req, UseGuards,
  UnauthorizedException,
} from 'next-js-backend';
import { AuthGuard } from 'next-js-backend';
import { JwtService, PasswordService } from 'next-js-backend';
import { UserStore } from './user.store';

@Controller('/auth')
export class AuthController {
  constructor(
    private readonly store: UserStore,
    private readonly jwt: JwtService,
    private readonly passwords: PasswordService,
  ) {}

  /** POST /api/auth/register */
  @Post('/register')
  async register(@Body() body: { email: string; name: string; password: string }) {
    return this.store.create(body);
  }

  /**
   * POST /api/auth/login
   * Verifies hashed password and returns a signed JWT via JwtService.signAsync()
   */
  @Post('/login')
  async login(@Body() body: { email: string; password: string }) {
    const user = this.store.findByEmail(body.email);
    if (!user) throw new UnauthorizedException('User not found');
    const valid = await this.passwords.verify(body.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid password');
    // Use signAsync (the correct method name)
    const token = await this.jwt.signAsync({ sub: user.id, email: user.email });
    return { access_token: token, token_type: 'Bearer' };
  }

  /**
   * GET /api/auth/me — protected by AuthGuard (verifies JWT from Authorization header)
   */
  @Get('/me')
  @UseGuards(AuthGuard)
  getMe(@Req() ctx: Record<string, unknown>) {
    return ctx['user'] ?? { message: 'Authenticated' };
  }

  /** GET /api/auth/hash-demo — shows bcrypt vs argon2 hashes */
  @Get('/hash-demo')
  async hashDemo() {
    const ps = new PasswordService();
    const runtime = typeof Bun !== 'undefined' ? 'Bun' : 'Node.js';
    const [bcrypt, argon2] = await Promise.all([
      ps.hash('secret', { algorithm: 'bcrypt' }),
      // argon2id is the correct variant name in PasswordService
      ps.hash('secret', { algorithm: 'argon2id' }),
    ]);
    return {
      runtime,
      backend: runtime === 'Bun' ? 'Bun.password (native)' : 'bcryptjs / argon2 (npm)',
      bcrypt,
      argon2,
    };
  }
}
