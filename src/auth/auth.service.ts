import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { NotificationsService } from '../notifications/notifications.service';
import { LoginUserDto } from '../users/dtos/login-user.dto';
import { RegisterUserDto } from '../users/dtos/register-user.dto';
import { User } from '../users/user.entity';
import { UsersService } from '../users/users.service';
import { JwtPayload } from './jwt-payload.interface';

export interface AuthResult {
  user: User;
  accessToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async register(userInfo: RegisterUserDto): Promise<AuthResult> {
    const user = await this.usersService.createUser(userInfo);
    await this.notificationsService.notifyWelcome(user.id, user.username);
    return { user, accessToken: this.issueToken(user) };
  }

  async login(credentials: LoginUserDto): Promise<AuthResult> {
    const user = await this.usersService.findByEmail(credentials.email);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }
    await this.usersService.verifyPassword(credentials.password, user.password);

    return { user, accessToken: this.issueToken(user) };
  }

  private issueToken(user: User): string {
    const payload: JwtPayload = { sub: user.id, email: user.email };
    return this.jwtService.sign(payload);
  }
}
