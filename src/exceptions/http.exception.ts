export class HttpException extends Error {
  constructor(
    public readonly response: string | Record<string, unknown> | unknown[],
    public readonly status: number,
  ) {
    super(typeof response === 'string' ? response : JSON.stringify(response));
    this.name = 'HttpException';
  }

  getResponse(): string | Record<string, unknown> | unknown[] {
    return this.response;
  }

  getStatus(): number {
    return this.status;
  }
}
