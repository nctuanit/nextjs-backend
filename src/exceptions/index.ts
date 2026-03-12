export * from './http.exception';
import { HttpException } from './http.exception';

export class BadRequestException extends HttpException {
  constructor(response?: string | Record<string, unknown> | unknown[]) {
    super(response || 'Bad Request', 400);
  }
}

export class UnauthorizedException extends HttpException {
  constructor(response?: string | Record<string, unknown> | unknown[]) {
    super(response || 'Unauthorized', 401);
  }
}

export class NotFoundException extends HttpException {
  constructor(response?: string | Record<string, unknown> | unknown[]) {
    super(response || 'Not Found', 404);
  }
}

export class ForbiddenException extends HttpException {
  constructor(response?: string | Record<string, unknown> | unknown[]) {
    super(response || 'Forbidden', 403);
  }
}

export class InternalServerErrorException extends HttpException {
  constructor(response?: string | Record<string, unknown> | unknown[]) {
    super(response || 'Internal Server Error', 500);
  }
}
