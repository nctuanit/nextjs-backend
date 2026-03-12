export class HttpException extends Error {
  constructor(
    public readonly response: string | Record<string, unknown> | unknown[],
    public readonly status: number,
  ) {
    super();
    this.name = 'HttpException';
  }

  getResponse(): string | Record<string, unknown> | unknown[] {
    return this.response;
  }

  getStatus(): number {
    return this.status;
  }
}

export class ForbiddenException extends HttpException {
  constructor(message = 'Forbidden') {
    super(message, 403);
  }
}

export class BadRequestException extends HttpException {
  constructor(message: string | string[] = 'Bad Request') {
    super(message, 400);
  }
}
