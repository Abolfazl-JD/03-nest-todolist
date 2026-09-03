import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { compare } from 'bcrypt';
import { Repository } from 'typeorm';

import { User } from './user.entity';
import { UsersService } from './users.service';

type MockRepo = Partial<Record<keyof Repository<User>, jest.Mock>>;

const createMockRepo = (): MockRepo => ({
  findOneBy: jest.fn(),
  create: jest.fn((dto: Partial<User>) => dto as User),
  save: jest.fn((entity: Partial<User>) => Promise.resolve(entity as User)),
});

describe('UsersService', () => {
  let service: UsersService;
  let repo: MockRepo;

  beforeEach(async () => {
    repo = createMockRepo();
    const moduleRef = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: repo },
      ],
    }).compile();

    service = moduleRef.get(UsersService);
  });

  describe('createUser', () => {
    const details = {
      username: 'ann',
      email: 'ann@example.com',
      password: 'password123',
    };

    it('stores a bcrypt hash rather than the plain password', async () => {
      repo.findOneBy.mockResolvedValue(null);

      const user = await service.createUser(details);

      expect(user.password).not.toBe(details.password);
      await expect(compare(details.password, user.password)).resolves.toBe(
        true,
      );
    });

    it('rejects a duplicate email with 409 rather than a database error', async () => {
      repo.findOneBy.mockResolvedValue({ id: 1 });

      await expect(service.createUser(details)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(repo.save).not.toHaveBeenCalled();
    });
  });

  describe('updateUser', () => {
    let existing: User;

    beforeEach(async () => {
      existing = {
        id: 1,
        username: 'ann',
        email: 'ann@example.com',
        password: await service.hashPassword('password123'),
      } as User;
      repo.findOneBy.mockResolvedValue(existing);
    });

    it('refuses to change the password when oldPassword is missing', async () => {
      await expect(
        service.updateUser(1, { password: 'brand-new-password' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);

      expect(repo.save).not.toHaveBeenCalled();
    });

    it('refuses to change the password when oldPassword is wrong', async () => {
      await expect(
        service.updateUser(1, {
          password: 'brand-new-password',
          oldPassword: 'not-the-right-one',
        }),
      ).rejects.toBeInstanceOf(UnauthorizedException);

      expect(repo.save).not.toHaveBeenCalled();
    });

    it('hashes the new password once oldPassword is verified', async () => {
      const updated = await service.updateUser(1, {
        password: 'brand-new-password',
        oldPassword: 'password123',
      });

      expect(updated.password).not.toBe('brand-new-password');
      await expect(
        compare('brand-new-password', updated.password),
      ).resolves.toBe(true);
    });

    it('updates the username without touching the password', async () => {
      const updated = await service.updateUser(1, { username: 'annie' });

      expect(updated.username).toBe('annie');
      expect(updated.password).toBe(existing.password);
    });

    it('rejects an email already taken by another account', async () => {
      repo.findOneBy.mockImplementation((where: Partial<User>) =>
        Promise.resolve(
          where.email === 'taken@example.com'
            ? ({ id: 2 } as User)
            : where.id === 1
              ? existing
              : null,
        ),
      );

      await expect(
        service.updateUser(1, { email: 'taken@example.com' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('verifyPassword', () => {
    it('throws when the password does not match', async () => {
      const hashed = await service.hashPassword('password123');

      await expect(
        service.verifyPassword('wrong', hashed),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });
});
