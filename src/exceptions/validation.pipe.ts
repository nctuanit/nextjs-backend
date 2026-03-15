import { validate, type ValidationError } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { type PipeTransform, type ArgumentMetadata } from '../interfaces';
import { BadRequestException } from './index';
import { type Context } from 'elysia';

export interface ValidationPipeOptions {
  transform?: boolean;
  disableErrorMessages?: boolean;
  whitelist?: boolean;
  forbidNonWhitelisted?: boolean;
}

export class ValidationPipe implements PipeTransform {
  constructor(private options: ValidationPipeOptions = { transform: true, whitelist: true }) {}

  async transform(value: unknown, metadata: ArgumentMetadata, context?: Context) {
    if (!metadata.metatype || !this.toValidate(metadata.metatype as Function)) {
      return value;
    }

    // Elysia might leave the body as a raw string if no TypeBox schema forces parsing
    let parseValue = value;
    if (metadata.type === 'body' && typeof value === 'string') {
        try {
            parseValue = JSON.parse(value);
        } catch(e) {}
    }

    const object = plainToInstance(metadata.metatype as any, parseValue as object);
    const errors = await validate(object as object, this.options);

    if (errors.length > 0) {
      const messages = this.formatErrors(errors);
      throw new BadRequestException(
        this.options.disableErrorMessages ? 'Bad Request' : messages
      );
    }

    return this.options.transform ? object : value;
  }

  private toValidate(metatype: Function): boolean {
    const types: Function[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }

  private formatErrors(errors: ValidationError[]): string[] {
    const result: string[] = [];
    for (const err of errors) {
      if (err.constraints) {
        for (const property in err.constraints) {
          result.push(err.constraints[property] as string);
          break; // Push just the first error message like NestJS defaults
        }
      } else {
        result.push('Validation failed');
      }
    }
    return result;
  }
}
