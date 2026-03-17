import 'reflect-metadata';
import { describe, it, expect, beforeAll } from 'bun:test';
import { Test } from 'next-js-backend';
import { PasswordService } from 'next-js-backend';
import { UserStore } from '../03-auth/backend/auth/user.store';

// Test 03-auth without JwtModule
// (JwtService requires DI-wired secret, tested via HTTP login flow instead)

describe('03-auth — PasswordService + UserStore + HTTP', () => {

  // ── PasswordService unit tests ────────────────────────
  describe('PasswordService', () => {
    const ps = new PasswordService();

    it('hashes and verifies a bcrypt password', async () => {
      const hash = await ps.hash('mypassword', { algorithm: 'bcrypt' });
      expect(hash).toMatch(/^\$2/);
      const valid = await ps.verify('mypassword', hash);
      expect(valid).toBe(true);
    });

    it('bcrypt fails on wrong password', async () => {
      const hash = await ps.hash('correct', { algorithm: 'bcrypt' });
      const valid = await ps.verify('wrong', hash);
      expect(valid).toBe(false);
    });

    it('hashes argon2id', async () => {
      const hash = await ps.hash('secret', { algorithm: 'argon2id' });
      expect(hash).toBeDefined();
      expect(hash).toContain('argon2');
    });

    it('argon2id verifies correctly', async () => {
      const hash = await ps.hash('argon-pass', { algorithm: 'argon2id' });
      const valid = await ps.verify('argon-pass', hash);
      expect(valid).toBe(true);
    });
  });

  // ── UserStore unit tests ──────────────────────────────
  describe('UserStore', () => {
    const store = new UserStore();

    it('creates a user and returns without passwordHash', async () => {
      const user = await store.create({ email: 'alice@example.com', name: 'Alice', password: 'pass123' });
      expect(user.email).toBe('alice@example.com');
      expect((user as Record<string, unknown>).passwordHash).toBeUndefined();
    });

    it('findByEmail returns the created user with passwordHash', async () => {
      await store.create({ email: 'bob@example.com', name: 'Bob', password: 'pass456' });
      const found = store.findByEmail('bob@example.com');
      expect(found?.name).toBe('Bob');
      expect(found?.passwordHash).toBeDefined(); // internal field exists on User
    });

    it('findByEmail returns undefined for unknown email', () => {
      const found = store.findByEmail('ghost@example.com');
      expect(found).toBeUndefined();
    });

    it('password is hashed (not stored plaintext)', async () => {
      await store.create({ email: 'charlie@example.com', name: 'Charlie', password: 'mypassword' });
      const found = store.findByEmail('charlie@example.com');
      expect(found?.passwordHash).not.toBe('mypassword');
    });
  });
});
