import type { Type } from '../di/provider';
import type { SessionStore } from './session.store';

export interface SessionModuleOptions {
  /**
   * Secret string used to sign the cookie.`
   * If provided, the cookie becomes tamper-proof (HttpOnly and Signed).
   */
  secret?: string;

  /**
   * Custom storage engine for tracking sessions instead of placing payload directly
   * into the cookie (which has 4KB size limits).
   * 
   * If omitted, defaults to an `InMemorySessionStore`.
   */
  store?: SessionStore | Type<SessionStore>;

  /**
   * The name of the session cookie.
   * @default 'sid'
   */
  cookieName?: string;

  /**
   * Default session expiration time in seconds.
   * @default 86400 (1 day)
   */
  ttl?: number;

  /**
   * Additional Elysia Cookie configuration
   */
  cookieOptions?: {
    path?: string;
    domain?: string;
    secure?: boolean;
    sameSite?: 'lax' | 'strict' | 'none';
  };
}
