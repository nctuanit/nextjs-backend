import type { Context } from 'elysia';
import { SessionData, User } from './globals';

/**
 * Extended context — intersection of Elysia's base Context with
 * properties injected at runtime by guards, interceptors, and built-in modules.
 *
 * Use this type in guard `canActivate()`, interceptors, and custom decorators
 * instead of the base `Context` when you need typed access to runtime-injected data.
 */
export interface AppContext {
  /** Authenticated user — injected by JwtAuthGuard / NextAuthGuard / custom guards */
  user?: User;
  /** Full session object — injected by NextAuthGuard (typed as Record to keep compatibility) */
  session?:SessionData;
  /** Cache key override — set by factory when @CacheKey() is used */
  cacheKey?: string;
  /** Cache TTL override — set by factory when @CacheTTL() is used */
  cacheTtl?: number;
}

/** Typed union of the base Elysia Context plus our runtime-injected properties */
export type ExtendedContext = Context & AppContext;

/** Helper to cast an Elysia Context to ExtendedContext without any `as any` */
export function asExtended(ctx: Context): ExtendedContext {
  return ctx as ExtendedContext;
}
