import { Injectable } from '../di/injectable.decorator';
import { type CanActivate } from '../interfaces';
import { type ExtendedContext } from '../types.augment';
import { JwtService } from './jwt.service';
import { UnauthorizedException } from '../exceptions';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExtendedContext): Promise<boolean> {
    const request = context.request;
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      throw new UnauthorizedException('Missing Authorization header');
    }

    const [type, token] = authHeader.split(' ');

    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException('Invalid token format (expected Bearer <token>)');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token);
      // Append user payload directly into the context stream so controllers can access it
      context.user = payload;
      return true;
    } catch (error) {
      throw new UnauthorizedException('Token is invalid or expired');
    }
  }
}
