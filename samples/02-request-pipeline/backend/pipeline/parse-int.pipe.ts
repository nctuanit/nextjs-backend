import 'reflect-metadata';
import {
  PipeTransform, ArgumentMetadata,
  BadRequestException,
} from 'next-js-backend';

/**
 * ParseIntPipe — parses string path param to integer
 * Demonstrates: custom PipeTransform
 */
export class ParseIntPipe implements PipeTransform<string, number> {
  transform(value: string, _metadata: ArgumentMetadata): number {
    const parsed = Number.parseInt(value, 10);
    if (Number.isNaN(parsed)) {
      throw new BadRequestException(`Validation failed: "${value}" is not an integer`);
    }
    return parsed;
  }
}
