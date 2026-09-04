import { IsEmail, IsNotEmpty, MaxLength, MinLength } from 'class-validator';

import { LowercaseEmail } from './lowercase-email.decorator';

export class RegisterUserDto {
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(50)
  username: string;

  @IsNotEmpty()
  @IsEmail()
  @LowercaseEmail()
  email: string;

  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(72)
  password: string;
}
