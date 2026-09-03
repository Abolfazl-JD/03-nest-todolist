import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';

import { User } from '../users/user.entity';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let users: Record<string, jest.Mock>;
  let jwt: { sign: jest.Mock };

  const existing = {
    id: 1,
    username: 'ann',
    email: 'ann@example.com',
    password: 'hashed',
  } as User;

  beforeEach(async () => {
    users = {
      createUser: jest.fn(() => Promise.resolve(existing)),
      findByEmail: jest.fn(),
      verifyPassword: jest.fn(() => Promise.resolve()),
    };
    jwt = { sign: jest.fn(() => 'signed.jwt.token') };

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: users },
        { provide: JwtService, useValue: jwt },
      ],
    }).compile();

    service = moduleRef.get(AuthService);
  });

  it('issues a token identifying the user on signup', async () => {
    const result = await service.register({
      username: 'ann',
      email: 'ann@example.com',
      password: 'password123',
    });

    expect(result.accessToken).toBe('signed.jwt.token');
    expect(jwt.sign).toHaveBeenCalledWith({ sub: 1, email: 'ann@example.com' });
  });

  it('issues a token on a successful login', async () => {
    users.findByEmail.mockResolvedValue(existing);

    const result = await service.login({
      email: 'ann@example.com',
      password: 'password123',
    });

    expect(users.verifyPassword).toHaveBeenCalledWith('password123', 'hashed');
    expect(result.accessToken).toBe('signed.jwt.token');
  });

  it('does not reveal whether the email exists', async () => {
    users.findByEmail.mockResolvedValue(null);

    await expect(
      service.login({ email: 'nobody@example.com', password: 'password123' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    await expect(
      service.login({ email: 'nobody@example.com', password: 'password123' }),
    ).rejects.toThrow('Invalid email or password');
    expect(jwt.sign).not.toHaveBeenCalled();
  });
});
