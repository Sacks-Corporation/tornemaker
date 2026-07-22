import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class BackofficeLoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
