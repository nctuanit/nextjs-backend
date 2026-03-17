export class HttpException extends Error {
  constructor(
    public readonly response: string | Record<string, unknown> | unknown[],
    public readonly status: number,
  ) {
    super(typeof response === 'string' ? response : JSON.stringify(response));
    this.name = this.constructor.name;
  }

  getResponse(): string | Record<string, unknown> | unknown[] {
    if (typeof this.response === 'string') {
      return {
        statusCode: this.status,
        message: this.response,
        error: this.name.replace('Exception', '').replace(/([A-Z])/g, ' $1').trim()
      };
    }
    return this.response;
  }

  getStatus(): number {
    return this.status;
  }
}
