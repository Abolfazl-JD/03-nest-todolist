import { Expose, Type } from 'class-transformer';

import { UserDto } from '../../users/dtos/user.dto';

export class AuthResponseDto {
  @Expose()
  @Type(() => UserDto)
  user: UserDto;

  @Expose()
  accessToken: string;
}
