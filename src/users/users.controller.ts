import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import { Serialize } from '../interceptors/serialize.interceptor';
import { UpdateUserDto } from './dtos/update-user.dto';
import { UserDto } from './dtos/user.dto';
import { User } from './user.entity';
import { UsersService } from './users.service';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard)
@Serialize(UserDto)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Return the authenticated user' })
  @ApiOkResponse({ type: UserDto })
  getCurrentUser(@CurrentUser() user: User) {
    return user;
  }

  @Patch('me')
  @ApiOperation({
    summary: 'Update the authenticated user',
    description:
      'Changing the password requires oldPassword to be supplied as well.',
  })
  @ApiOkResponse({ type: UserDto })
  @ApiUnauthorizedResponse({ description: 'oldPassword missing or incorrect' })
  @ApiConflictResponse({ description: 'That email is already registered' })
  updateCurrentUser(@CurrentUser() user: User, @Body() changes: UpdateUserDto) {
    return this.usersService.updateUser(user.id, changes);
  }
}
