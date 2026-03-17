import 'reflect-metadata';
import {
  Controller, Get, Param,
} from 'next-js-backend';
import { StreamFileResponse } from 'next-js-backend';
import { join } from 'path';

@Controller('/files')
export class FilesController {
  /** GET /api/files/download/:name — stream a static file */
  @Get('/download/:name')
  async download(@Param('name') name: string): Promise<Response> {
    // Only allow specific demo files
    const allowed = ['sample.txt', 'data.json', 'image.svg'];
    if (!allowed.includes(name)) {
      return new Response(JSON.stringify({ error: 'File not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    const filePath = join(process.cwd(), 'public', 'demo-files', name);
    return StreamFileResponse.from(filePath);
  }

  /** GET /api/files/stream-text — stream inline generated text */
  @Get('/stream-text')
  streamText(): Response {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const lines = [
          'Line 1: Hello from StreamFileResponse!\n',
          'Line 2: This is streamed chunk by chunk.\n',
          'Line 3: next-js-backend supports full file streaming.\n',
          'Line 4: Works with images, PDFs, CSVs, and more.\n',
          'Line 5: Done ✅\n',
        ];
        for (const line of lines) {
          controller.enqueue(encoder.encode(line));
          await new Promise(r => setTimeout(r, 200));
        }
        controller.close();
      },
    });
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'X-Demo': 'next-js-backend StreamFileResponse',
      },
    });
  }

  /** GET /api/files/info — list available demo files */
  @Get('/info')
  info() {
    return {
      available: ['sample.txt', 'data.json', 'image.svg'],
      usage: 'GET /api/files/download/:name',
      note: 'StreamFileResponse.from(filePath) streams from disk with proper headers',
    };
  }
}
