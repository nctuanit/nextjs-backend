import 'reflect-metadata';

export const STREAM_FILE_METADATA = 'STREAM_FILE_METADATA';

export interface StreamFileOptions {
  fileName?: string;
  contentType?: string;
  disposition?: 'attachment' | 'inline';
  headers?: Record<string, string>;
}

/**
 * Mark a controller method as a file-streaming endpoint.
 * The method should return a `StreamFileResponse` instance.
 *
 * @example
 * ```ts
 * @Get('/download/:id')
 * @StreamFile()
 * async download(@Param('id') id: string) {
 *   const file = Bun.file(`./uploads/${id}`);
 *   return new StreamFileResponse(file);
 * }
 * ```
 */
export function StreamFile(): MethodDecorator {
  return (target, key, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata(STREAM_FILE_METADATA, true, descriptor.value);
    return descriptor;
  };
}
