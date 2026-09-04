import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

import { LowercaseEmail } from './lowercase-email.decorator';

export class UpdateUserDto {
  @IsOptional()
  @MinLength(1)
  @MaxLength(50)
  username?: string;

  @IsOptional()
  @IsEmail()
  @LowercaseEmail()
  email?: string;

  @IsOptional()
  @MinLength(8)
  @MaxLength(72)
  password?: string;

  @ValidateIf((dto: UpdateUserDto) => dto.password !== undefined)
  @IsNotEmpty({ message: 'oldPassword is required when changing password' })
  oldPassword?: string;
}
