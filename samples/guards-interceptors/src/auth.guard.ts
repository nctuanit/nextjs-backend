import { type Context } from 'elysia';
import { Injectable, type CanActivate } from 'next-js-backend';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: Context): boolean {
    const authHeaders = context.headers['authorization'];
    // In a real app, verify the JWT token
    const isValid = authHeaders === 'Bearer my-secret-token';
    
    if (!isValid) {
      console.log('🔴 [AuthGuard] Request blocked - Invalid Token!');
    }
    
    return isValid;
  }
}
