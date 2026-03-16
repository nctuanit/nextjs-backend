# NextAuth (Auth.js)

Integrate [Auth.js (NextAuth.js v5)](https://authjs.dev/) with your Next.js Backend for OAuth providers, magic links, and more.

## Setup

```typescript
import { Module, NextAuthModule } from "next-js-backend";

@Module({
  imports: [
    NextAuthModule.register({
      nextAuthUrl: process.env.NEXTAUTH_URL!,
      secret: process.env.NEXTAUTH_SECRET!,
    }),
  ],
})
export class AppModule {}
```

## NextAuthGuard

Protects routes by validating the Auth.js session cookie:

```typescript
import { UseGuards } from "next-js-backend";
import { NextAuthGuard } from "next-js-backend";

@Controller("/dashboard")
export class DashboardController {
  @Get("/data")
  @UseGuards(NextAuthGuard)
  getData(@CurrentUser() session: Session) {
    return { user: session.user };
  }
}
```

## Session Data

The `NextAuthGuard` injects:

- `context.user` — `session.user` object
- `context.session` — full session object

Use with `createParamDecorator`:

```typescript
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: Context) => {
    const user = (ctx as any).user;
    return data ? user?.[data] : user;
  },
);
```

```typescript
@Get('/profile')
@UseGuards(NextAuthGuard)
getProfile(@CurrentUser() user: { name: string; email: string; image: string }) {
  return user;
}
```

## How It Works

`NextAuthGuard` makes a server-side call to the Auth.js session endpoint at `NEXTAUTH_URL` to validate the cookie, then attaches the session to the Elysia context.

## Environment Variables

```ini [.env]
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key
```
