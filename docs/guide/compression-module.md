# Compression Module

The `CompressionModule` enables automatic response compression. The implementation is selected at runtime based on the detected JavaScript engine — no configuration required.

## Runtime Backends

| Runtime | gzip | deflate | brotli (`br`) |
|---------|------|---------|---------------|
| **Bun** | `Bun.gzipSync` | `Bun.deflateSync` | falls back to gzip |
| **Node.js ≥ 20** | `node:zlib.gzipSync` | `node:zlib.deflateSync` | `node:zlib.brotliCompressSync` |

Compression only applies when the client sends an `Accept-Encoding` header that includes the configured encoding, and the response body exceeds the configured `threshold`.

## Setup

```typescript
import { Module, CompressionModule } from 'next-js-backend';

@Module({
  imports: [
    CompressionModule.register({
      encoding: 'gzip',   // 'gzip' | 'deflate' | 'br'
      threshold: 1024,    // minimum response size in bytes (default: 1024)
      level: 6,           // compression level 0–9 (default: 6)
    }),
  ],
})
export class AppModule {}
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `encoding` | `'gzip' \| 'deflate' \| 'br'` | `'gzip'` | Compression algorithm |
| `threshold` | `number` | `1024` | Minimum response body size in bytes to trigger compression |
| `level` | `number` | `6` | Compression level 0 (fastest) – 9 (best compression) |

::: tip Brotli on Bun
Bun does not expose a native `brotliSync` API. When `encoding: 'br'` is configured and the app runs on Bun, compression falls back to gzip and the `Content-Encoding: gzip` header is set accordingly.

On Node.js ≥ 20, `brotliCompressSync` is used natively and the `Content-Encoding: br` header is sent correctly.
:::

## How It Works

The module hooks into Elysia's `onAfterHandle` lifecycle event. After the route handler produces a response:

1. Check if the client's `Accept-Encoding` header includes the configured encoding.
2. Read the response body as an `ArrayBuffer`.
3. Skip compression if the body is smaller than `threshold`.
4. Compress using the runtime-appropriate backend.
5. Return a new `Response` with the compressed body and updated `Content-Encoding` header. The `Content-Length` header is removed to let the transport layer recalculate it.

```
Handler Response → onAfterHandle hook → Accept-Encoding check →
threshold check → runtime compress → Response(compressed)
```
