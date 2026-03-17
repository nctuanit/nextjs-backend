# JWT & Authentication

## JwtModule

The `JwtModule` provides JWT token generation and verification.

### Setup

```typescript
import { Module, JwtModule } from 'next-js-backend';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET!,
      expiresIn: '7d',      // Token expiry
      algorithm: 'HS256',   // Default
    }),
  ],
})
export class AppModule {}
```

### JwtService

```typescript
import { Injectable } from 'next-js-backend';
import { JwtService } from 'next-js-backend';

@Injectable()
export class AuthService {
  constructor(private readonly jwt: JwtService) {}

  async login(user: User) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    const token = await this.jwt.sign(payload);
    return { access_token: token };
  }

  async validateToken(token: string) {
    return this.jwt.verify<{ sub: string; email: string }>(token);
  }
}
```

### JwtAuthGuard

Protects routes by validating the `Authorization: Bearer <token>` header:

```typescript
import { UseGuards } from 'next-js-backend';
import { JwtAuthGuard } from 'next-js-backend';

@Controller('/users')
export class UserController {
  @Get('/profile')
  @UseGuards(JwtAuthGuard)
  getProfile(@CurrentUser() user: JwtPayload) {
    return user; // Decoded payload from JWT
  }
}
```

### Full Auth Flow

```typescript
@Controller('/auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  @Post('/register')
  async register(@Body() dto: RegisterDto) {
    const user = await this.userService.create(dto);
    return this.authService.login(user);
  }

  @Post('/login')
  async login(@Body() dto: LoginDto) {
    const user = await this.authService.validateCredentials(dto);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    return this.authService.login(user);
  }

  @Post('/refresh')
  @UseGuards(JwtAuthGuard)
  async refresh(@CurrentUser() user: JwtPayload) {
    return this.authService.login(user);
  }
}
```

## Password Hashing

`PasswordService` selects the hashing backend automatically based on the detected runtime:

| Runtime | bcrypt | argon2id / argon2d / argon2i |
|---------|--------|------------------------------|
| **Bun** | `Bun.password` (native) | `Bun.password` (native) |
| **Node.js ≥ 20** | `bcryptjs` npm package | `argon2` npm package |

No configuration is required — the detection happens at the first call.

```typescript
import { PasswordService } from 'next-js-backend';

@Injectable()
export class AuthService {
  constructor(private readonly passwords: PasswordService) {}

  async register(dto: RegisterDto) {
    // Defaults to bcrypt (cost 10). Works identically on Bun and Node.js.
    const hashed = await this.passwords.hash(dto.password);
    return this.userService.create({ ...dto, password: hashed });
  }

  async register_argon2(dto: RegisterDto) {
    // Use argon2id for higher memory-hardness guarantees.
    const hashed = await this.passwords.hash(dto.password, { algorithm: 'argon2id' });
    return this.userService.create({ ...dto, password: hashed });
  }

  async validateCredentials(dto: LoginDto) {
    const user = await this.userService.findByEmail(dto.email);
    if (!user) return null;
    // verify() detects hash format ($2b$ for bcrypt, $argon2 for argon2)
    // and delegates to the correct backend automatically.
    const valid = await this.passwords.verify(dto.password, user.password);
    return valid ? user : null;
  }
}
```

### Supported Algorithms

| Value | Description |
|-------|-------------|
| `'bcrypt'` | Default. Cost factor 4–31, default 10. |
| `'argon2id'` | Recommended for new systems. Resistant to GPU and side-channel attacks. |
| `'argon2d'` | GPU-attack resistant, less side-channel protection. |
| `'argon2i'` | Side-channel resistant, less GPU protection. |
