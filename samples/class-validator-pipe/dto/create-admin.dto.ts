import { IsString, IsInt, Min, Max, IsEmail } from 'class-validator';

export class CreateAdminDto {
  @IsString()
  username!: string;

  @IsEmail()
  email!: string;

  @IsInt()
  @Min(18)
  @Max(99)
  age!: number;
}
