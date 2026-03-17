import 'reflect-metadata';
import {
  Injectable, CanActivate,
} from 'next-js-backend';

/**
 * RolesGuard — grants access only when request has ?role=admin query
 * Demonstrates: implementing CanActivate
 */
@Injectable()
export class RolesGuard implements CanActivate {
  canActivate(context: { request: Request }): boolean {
    const url = new URL(context.request.url);
    const role = url.searchParams.get('role');
    return role === 'admin';
  }
}
