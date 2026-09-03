import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { Serialize } from '../interceptors/serialize.interceptor';
import { LoginUserDto } from '../users/dtos/login-user.dto';
import { RegisterUserDto } from '../users/dtos/register-user.dto';
import { AuthService } from './auth.service';
import { AuthResponseDto } from './dtos/auth-response.dto';

@ApiTags('Authentication')
@Controller('auth')
@Serialize(AuthResponseDto)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @ApiOperation({ summary: 'Create an account and receive an access token' })
  @ApiCreatedResponse({ type: AuthResponseDto })
  @ApiConflictResponse({ description: 'That email is already registered' })
  register(@Body() userInfo: RegisterUserDto) {
    return this.authService.register(userInfo);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Exchange credentials for an access token' })
  @ApiOkResponse({ type: AuthResponseDto })
  @ApiUnauthorizedResponse({ description: 'Invalid email or password' })
  login(@Body() credentials: LoginUserDto) {
    return this.authService.login(credentials);
  }
}
