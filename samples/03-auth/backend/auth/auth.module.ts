import { Module } from 'next-js-backend';
import { JwtModule, PasswordService } from 'next-js-backend';
import { AuthController } from './auth.controller';
import { UserStore } from './user.store';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'sample-dev-secret-change-in-prod',
      // expiresIn goes inside signOptions (not top level)
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [AuthController],
  providers: [UserStore, PasswordService],
})
export class AuthModule {}
