import { expect, test, describe } from 'bun:test';
import { PasswordService } from '../password.service';

describe('PasswordService', () => {
  const passwordService = new PasswordService();

  test('should hash and verify passwords correctly using default (bcrypt)', async () => {
    const rawPassword = 'super-secret-password';
    
    // Hash
    const hash = await passwordService.hash(rawPassword);
    
    expect(hash).toBeString();
    expect(hash).not.toEqual(rawPassword);
    
    // Verify success
    const isMatch = await passwordService.verify(rawPassword, hash);
    expect(isMatch).toBe(true);
    
    // Verify fail
    const isNotMatch = await passwordService.verify('wrong-password', hash);
    expect(isNotMatch).toBe(false);
  });

  test('should hash and verify passwords using argon2', async () => {
    const rawPassword = 'another-password-123';
    
    // Hash
    const hash = await passwordService.hash(rawPassword, { algorithm: 'argon2id' });
    
    expect(hash).toBeString();
    expect(hash.startsWith('$argon2')).toBe(true);
    
    // Verify success
    const isMatch = await passwordService.verify(rawPassword, hash);
    expect(isMatch).toBe(true);
  });
});
