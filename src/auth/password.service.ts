import { Injectable } from '../di/injectable.decorator';

export interface HashOptions {
  /**
   * The hashing algorithm to use.
   * Bun natively supports 'bcrypt', 'argon2id', 'argon2d', 'argon2i'.
   * @default 'bcrypt'
   */
  algorithm?: 'bcrypt' | 'argon2id' | 'argon2d' | 'argon2i';
  
  /**
   * For bcrypt: the cost factor (4-31). Default is 10.
   * For argon2: memory cost, time cost, etc. are handled securely by Bun.
   */
  cost?: number;
}

@Injectable()
export class PasswordService {
  /**
   * Hashes a plaintext password securely.
   * Uses Bun's native, highly optimized `Bun.password.hash` engine.
   * 
   * @param password The raw, plaintext password.
   * @param options Hashing algorithm options (default: bcrypt, cost: 10).
   * @returns A Promise that resolves to the hashed password string.
   */
  async hash(password: string, options?: HashOptions): Promise<string> {
    const alg = options?.algorithm || 'bcrypt';
    const cost = options?.cost || 10;
    
    return Bun.password.hash(password, {
      algorithm: alg,
      cost,
    } as any);
  }

  /**
   * Verifies a plaintext password against a previously hashed password string.
   * 
   * @param password The raw, plaintext password to check.
   * @param hash The stored hash string (argon2 or bcrypt).
   * @returns A Promise that resolves to true if the password matches the hash.
   */
  async verify(password: string, hash: string): Promise<boolean> {
    return Bun.password.verify(password, hash);
  }
}
