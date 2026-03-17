import { Injectable } from '../di/injectable.decorator';

export interface HashOptions {
  /**
   * The hashing algorithm to use.
   * Supports 'bcrypt', 'argon2id', 'argon2d', 'argon2i'.
   * @default 'bcrypt'
   */
  algorithm?: 'bcrypt' | 'argon2id' | 'argon2d' | 'argon2i';
  
  /**
   * For bcrypt: the cost factor (4-31). Default is 10.
   * For argon2: time cost. Default is 3.
   */
  cost?: number;
}

/** Detect whether we are running inside Bun (has native Bun.password API). */
const isBun = typeof globalThis.Bun !== 'undefined' && typeof (globalThis.Bun as Record<string, unknown>).password !== 'undefined';

@Injectable()
export class PasswordService {
  /**
   * Hashes a plaintext password securely.
   * Uses Bun's native `Bun.password.hash` when running on Bun,
   * and falls back to `bcryptjs` / `argon2` npm packages on Node.js.
   *
   * @param password The raw, plaintext password.
   * @param options Hashing algorithm options (default: bcrypt, cost: 10).
   * @returns A Promise that resolves to the hashed password string.
   */
  async hash(password: string, options?: HashOptions): Promise<string> {
    const alg = options?.algorithm ?? 'bcrypt';
    const cost = options?.cost ?? 10;

    if (isBun) {
      return (globalThis.Bun as { password: { hash(p: string, opts: object): Promise<string> } }).password.hash(password, {
        algorithm: alg,
        cost,
      });
    }

    // --- Node.js fallback ---
    if (alg === 'bcrypt') {
      const bcrypt = await import('bcryptjs');
      return bcrypt.hash(password, cost);
    }

    // argon2id / argon2d / argon2i
    const argon2 = await import('argon2');
    const typeMap: Record<string, number> = {
      argon2id: argon2.argon2id,
      argon2d: argon2.argon2d,
      argon2i: argon2.argon2i,
    };
    const typeValue = (typeMap[alg] ?? argon2.argon2id) as 0 | 1 | 2;
    return argon2.hash(password, { type: typeValue });
  }

  /**
   * Verifies a plaintext password against a previously hashed password string.
   * Automatically detects whether the hash is bcrypt or argon2 format.
   *
   * @param password The raw, plaintext password to check.
   * @param hash The stored hash string (argon2 or bcrypt).
   * @returns A Promise that resolves to true if the password matches the hash.
   */
  async verify(password: string, hash: string): Promise<boolean> {
    if (isBun) {
      return (globalThis.Bun as { password: { verify(p: string, h: string): Promise<boolean> } }).password.verify(password, hash);
    }

    // --- Node.js fallback ---
    // Detect hash type from prefix: argon2 hashes start with "$argon2"
    if (hash.startsWith('$argon2')) {
      const argon2 = await import('argon2');
      return argon2.verify(hash, password);
    }

    // Default: bcrypt ($2a$, $2b$, $2y$ prefixes)
    const bcrypt = await import('bcryptjs');
    return bcrypt.compare(password, hash);
  }
}
