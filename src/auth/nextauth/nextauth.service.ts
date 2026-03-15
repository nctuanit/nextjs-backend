import type { AuthConfig } from '@auth/core';
import { Auth } from '@auth/core';
import { Injectable } from '../../di/injectable.decorator';

export const NEXTAUTH_CONFIG = Symbol('NEXTAUTH_CONFIG');

export interface NextAuthSession {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    [key: string]: unknown;
  };
  expires: string;
  [key: string]: unknown;
}

/**
 * NextAuthService wraps @auth/core to provide authentication
 * capabilities within the next-js-backend DI system.
 */
@Injectable()
export class NextAuthService {
  private config!: AuthConfig;

  setConfig(config: AuthConfig) {
    this.config = config;
  }

  /**
   * Handle Auth.js requests (signin, signout, callback, csrf, etc.)
   * Mount this on your auth API routes.
   */
  async handleRequest(request: Request): Promise<Response> {
    return Auth(request, this.config);
  }

  /**
   * Get the current session from a request.
   * Returns null if the user is not authenticated.
   */
  async getSession(request: Request): Promise<NextAuthSession | null> {
    // Build a session request to the Auth.js /api/auth/session endpoint
    const url = new URL(request.url);
    const sessionUrl = new URL('/api/auth/session', url.origin);
    
    const sessionRequest = new Request(sessionUrl.toString(), {
      headers: request.headers,
    });

    const response = await Auth(sessionRequest, this.config);
    
    if (!response.ok) return null;
    
    const session = await response.json() as NextAuthSession;
    
    // Auth.js returns {} when there's no session
    if (!session || !session.user) return null;
    
    return session;
  }
}
