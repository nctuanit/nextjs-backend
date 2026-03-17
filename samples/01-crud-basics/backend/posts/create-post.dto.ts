import 'reflect-metadata';
import { IsString, MinLength, IsNotEmpty } from 'class-validator';

export class CreatePostDto {
  @IsString() @MinLength(3) title!: string;
  @IsString() @IsNotEmpty() body!: string;
  @IsString() @IsNotEmpty() author!: string;
}
