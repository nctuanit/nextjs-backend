import { Injectable } from '../../di/injectable.decorator';
import { type CanActivate } from '../../interfaces';
import { type ExtendedContext } from '../../types.augment';
import { NextAuthService } from './nextauth.service';
import { UnauthorizedException } from '../../exceptions';

/**
 * NextAuthGuard is a Guard that verifies the user's session
 * using NextAuth / Auth.js. 
 * 
 * Usage:
 *   @UseGuards(NextAuthGuard)
 *   @Get('/profile')
 *   getProfile(@Req() req: Request) {
 *     return req.user; // injected by the guard
 *   }
 */
@Injectable()
export class NextAuthGuard implements CanActivate {
  constructor(private readonly nextAuthService: NextAuthService) {}

  async canActivate(context: ExtendedContext): Promise<boolean> {
    const request = context.request;
    const session = await this.nextAuthService.getSession(request);
    
    if (!session || !session.user) {
      throw new UnauthorizedException('Not authenticated. Please sign in via NextAuth.');
    }

    // Attach session and user to the context for downstream access
    context.user = session.user as Record<string, unknown>;
    context.session = session as Record<string, unknown>;
    return true;
  }
}
