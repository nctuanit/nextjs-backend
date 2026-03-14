import { expect, test, describe } from 'bun:test';
import { Controller } from '../../decorators/controller.decorator';
import { Post } from '../../decorators/method.decorator';
import { File, Files } from '../../decorators/param.decorator';
import { Module } from '../../decorators/module.decorator';
import { ElysiaFactory } from '../elysia-factory';

@Controller('/upload')
class UploadController {
  @Post('/single')
  uploadSingle(@File('avatar') avatar: globalThis.File) {
    if (!avatar) return { error: 'No file' };
    return { name: avatar.name, size: avatar.size };
  }

  @Post('/multiple')
  uploadMultiple(@Files('documents') docs: globalThis.File[]) {
    if (!docs) return { error: 'No files' };
    // Elysia sometimes parses single items as just the item, and multiple as an array.
    // If it's a single file, we wrap it in an array for consistency
    const filesArray = Array.isArray(docs) ? docs : [docs];
    return { count: filesArray.length, first: filesArray[0]?.name };
  }
}

@Module({
  controllers: [UploadController]
})
class UploadModule {}

describe('File Upload Decorators', () => {
  test('should handle single file upload', async () => {
    const app = await ElysiaFactory.create(UploadModule);
    
    const formData = new FormData();
    const file = new globalThis.File(['hello world'], 'avatar.jpg', { type: 'image/jpeg' });
    formData.append('avatar', file);

    const req = new Request('http://localhost/upload/single', {
      method: 'POST',
      body: formData,
    });

    const res = await app.handle(req);
    const json = await res.json();
    
    expect(res.status).toBe(200);
    expect(json).toEqual({ name: 'avatar.jpg', size: 11 });
  });

  test('should handle multiple files upload', async () => {
    const app = await ElysiaFactory.create(UploadModule);
    
    const formData = new FormData();
    formData.append('documents', new globalThis.File(['doc1'], 'doc1.pdf'));
    formData.append('documents', new globalThis.File(['doc22'], 'doc2.pdf'));

    const req = new Request('http://localhost/upload/multiple', {
      method: 'POST',
      body: formData,
    });

    const res = await app.handle(req);
    const json = await res.json() as any;
    
    expect(res.status).toBe(200);
    expect(json.count).toBe(2);
    expect(json.first).toBe('doc1.pdf');
  });

  test('should gracefully handle when no file is provided', async () => {
    const app = await ElysiaFactory.create(UploadModule);
    
    const formData = new FormData();
    // Intentionally omit appending 'avatar'

    const req = new Request('http://localhost/upload/single', {
      method: 'POST',
      body: formData,
    });

    const res = await app.handle(req);
    const json = await res.json();
    
    // In Elysia, missing optional form data is undefined. 
    // It should hit our `if (!avatar) return { error: 'No file' }`
    expect(res.status).toBe(200);
    expect(json).toEqual({ error: 'No file' });
  });

  test('should gracefully handle when non-file string is sent instead of File', async () => {
    const app = await ElysiaFactory.create(UploadModule);
    
    const formData = new FormData();
    // Append a string instead of a File object
    formData.append('avatar', 'just text string');

    const req = new Request('http://localhost/upload/single', {
      method: 'POST',
      body: formData,
    });

    const res = await app.handle(req);
    const json = await res.json() as any;
    
    // In Elysia multipart form data, appending just a string still comes through,
    // but without `.name` or `.size` (unless it's coerced). Our handler expects a File.
    expect(res.status).toBe(200);
    // Because 'just text string' string lacks name and size properties
    expect(json.name).toBeUndefined();
    expect(json.size).toBeUndefined();
  });
});
