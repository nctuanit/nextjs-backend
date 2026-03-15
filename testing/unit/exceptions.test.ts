/**
 * Exceptions & Error Handling Tests
 *
 * Tests all HttpException subclasses and error propagation.
 */
import { describe, test, expect } from 'bun:test';
import 'reflect-metadata';

import {
  HttpException,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
  ForbiddenException,
  InternalServerErrorException,
} from '../../src/exceptions';

// ═══════════════════════════════════════════════════════════════════
// HttpException Base
// ═══════════════════════════════════════════════════════════════════

describe('Exceptions > HttpException', () => {
  test('should create with response and status', () => {
    const err = new HttpException('Something failed', 400);
    expect(err.getStatus()).toBe(400);
    expect(err.getResponse()).toBe('Something failed');
  });

  test('should accept object response', () => {
    const err = new HttpException({ error: 'Validation', details: ['field required'] }, 422);
    expect(err.getStatus()).toBe(422);
    expect(err.getResponse()).toEqual({ error: 'Validation', details: ['field required'] });
  });

  test('should be instanceof Error', () => {
    const err = new HttpException('test', 500);
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(HttpException);
  });
});

// ═══════════════════════════════════════════════════════════════════
// Exception Subclasses
// ═══════════════════════════════════════════════════════════════════

describe('Exceptions > Subclasses', () => {
  test('BadRequestException should be 400', () => {
    const err = new BadRequestException();
    expect(err.getStatus()).toBe(400);
    expect(err.getResponse()).toBe('Bad Request');
  });

  test('BadRequestException should accept custom message', () => {
    const err = new BadRequestException('Invalid email');
    expect(err.getResponse()).toBe('Invalid email');
    expect(err.getStatus()).toBe(400);
  });

  test('UnauthorizedException should be 401', () => {
    const err = new UnauthorizedException();
    expect(err.getStatus()).toBe(401);
    expect(err.getResponse()).toBe('Unauthorized');
  });

  test('ForbiddenException should be 403', () => {
    const err = new ForbiddenException();
    expect(err.getStatus()).toBe(403);
  });

  test('NotFoundException should be 404', () => {
    const err = new NotFoundException();
    expect(err.getStatus()).toBe(404);
  });

  test('NotFoundException should accept custom message', () => {
    const err = new NotFoundException('User not found');
    expect(err.getResponse()).toBe('User not found');
  });

  test('InternalServerErrorException should be 500', () => {
    const err = new InternalServerErrorException();
    expect(err.getStatus()).toBe(500);
  });

  test('All exceptions should be instanceof HttpException', () => {
    expect(new BadRequestException()).toBeInstanceOf(HttpException);
    expect(new UnauthorizedException()).toBeInstanceOf(HttpException);
    expect(new NotFoundException()).toBeInstanceOf(HttpException);
    expect(new ForbiddenException()).toBeInstanceOf(HttpException);
    expect(new InternalServerErrorException()).toBeInstanceOf(HttpException);
  });
});
