import type { StreamFileOptions } from '../decorators/stream-file.decorator';

/**
 * Return this from a `@StreamFile()` decorated controller method
 * to stream file contents to the client with proper headers.
 *
 * @example
 * ```ts
 * @Get('/pdf/:name')
 * @StreamFile()
 * async getPdf(@Param('name') name: string) {
 *   const blob = Bun.file(`./uploads/${name}.pdf`);
 *   return new StreamFileResponse(blob, { contentType: 'application/pdf' });
 * }
 * ```
 */
export class StreamFileResponse {
  readonly source: ReadableStream | Blob | ArrayBuffer | Uint8Array;
  readonly options: Required<Omit<StreamFileOptions, 'headers'>> & { headers: Record<string, string> };

  constructor(
    source: ReadableStream | Blob | ArrayBuffer | Uint8Array,
    options: StreamFileOptions = {},
  ) {
    this.source = source;
    this.options = {
      fileName: options.fileName ?? 'download',
      contentType: options.contentType ?? (source instanceof Blob ? (source.type || 'application/octet-stream') : 'application/octet-stream'),
      disposition: options.disposition ?? 'attachment',
      headers: options.headers ?? {},
    };
  }

  /** Convert to a native Response object */
  toResponse(): Response {
    const { fileName, contentType, disposition, headers } = this.options;
    const contentDisp = `${disposition}; filename="${encodeURIComponent(fileName)}"`;

    let body: BodyInit;
    if (this.source instanceof ReadableStream) {
      body = this.source;
    } else if (this.source instanceof Blob) {
      body = this.source;
    } else if (this.source instanceof ArrayBuffer) {
      body = this.source;
    } else {
      // Uint8Array — wrap in ArrayBuffer
      body = (this.source as Uint8Array).buffer as ArrayBuffer;
    }

    return new Response(body, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': contentDisp,
        'Cache-Control': 'no-store',
        ...headers,
      },
    });
  }
}
