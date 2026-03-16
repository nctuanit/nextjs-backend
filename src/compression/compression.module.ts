import type { DynamicModule } from '../interfaces';

export const COMPRESSION_CONFIG = 'COMPRESSION_CONFIG';

export type CompressionEncoding = 'gzip' | 'br' | 'deflate';

export interface CompressionOptions {
  /**
   * Compression algorithm.
   * @default 'gzip'
   */
  encoding?: CompressionEncoding;
  /**
   * Only compress responses larger than this byte threshold.
   * @default 1024 (1 KB)
   */
  threshold?: number;
  /**
   * Compression quality level (0–9 for gzip/deflate, 0–11 for brotli).
   * @default 6
   */
  level?: number;
}

/**
 * Enable response compression via Bun's native compression APIs.
 *
 * @example
 * ```ts
 * @Module({
 *   imports: [
 *     CompressionModule.register({ encoding: 'gzip', threshold: 1024 }),
 *   ],
 * })
 * export class AppModule {}
 * ```
 */
export class CompressionModule {
  static register(options: CompressionOptions = {}): DynamicModule {
    return {
      module: CompressionModule,
      providers: [
        {
          provide: COMPRESSION_CONFIG,
          useValue: {
            encoding: options.encoding ?? 'gzip',
            threshold: options.threshold ?? 1024,
            level: options.level ?? 6,
          } satisfies Required<CompressionOptions>,
        },
      ],
      exports: [COMPRESSION_CONFIG],
    };
  }
}
