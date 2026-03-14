import 'reflect-metadata';

export const SSE_METADATA = '__sse__';

/**
 * @Sse(path) decorator
 * Marks a controller method as a Server-Sent Events endpoint.
 * The decorated method should return an AsyncGenerator or ReadableStream.
 * 
 * @example
 * ```ts
 * @Sse('/events')
 * async *streamEvents() {
 *   while (true) {
 *     yield { data: JSON.stringify({ time: Date.now() }) };
 *     await new Promise(r => setTimeout(r, 1000));
 *   }
 * }
 * ```
 */
export function Sse(path: string = '/sse'): MethodDecorator {
  return (target: object | Function, key: string | symbol, descriptor: PropertyDescriptor) => {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    Reflect.defineMetadata(SSE_METADATA, normalizedPath, descriptor.value);
    return descriptor;
  };
}
