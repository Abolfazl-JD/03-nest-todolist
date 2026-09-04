import { IsEmail, IsNotEmpty } from 'class-validator';

import { LowercaseEmail } from './lowercase-email.decorator';

export class LoginUserDto {
  @IsNotEmpty()
  @IsEmail()
  @LowercaseEmail()
  email: string;

  @IsNotEmpty()
  password: string;
}
