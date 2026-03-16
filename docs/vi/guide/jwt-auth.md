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

```typescript
import { PasswordService } from 'next-js-backend';

@Injectable()
export class AuthService {
  constructor(private readonly passwords: PasswordService) {}

  async register(dto: RegisterDto) {
    const hashed = await this.passwords.hash(dto.password);
    return this.userService.create({ ...dto, password: hashed });
  }

  async validateCredentials(dto: LoginDto) {
    const user = await this.userService.findByEmail(dto.email);
    if (!user) return null;
    const valid = await this.passwords.verify(dto.password, user.password);
    return valid ? user : null;
  }
}
```
