import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { compare, genSalt, hash } from 'bcrypt';
import { Repository } from 'typeorm';

import { RegisterUserDto } from './dtos/register-user.dto';
import { UpdateUserDto } from './dtos/update-user.dto';
import { User } from './user.entity';

const BCRYPT_ROUNDS = 10;

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
  ) {}

  async createUser(userInfo: RegisterUserDto): Promise<User> {
    const existing = await this.findByEmail(userInfo.email);
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const user = this.usersRepository.create({
      ...userInfo,
      password: await this.hashPassword(userInfo.password),
    });

    return this.usersRepository.save(user);
  }

  findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOneBy({ email });
  }

  findById(id: number): Promise<User | null> {
    return this.usersRepository.findOneBy({ id });
  }

  async getById(id: number): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException(`No user found with id ${id}`);
    }
    return user;
  }

  async updateUser(userId: number, changes: UpdateUserDto): Promise<User> {
    const user = await this.getById(userId);
    const { password, oldPassword, ...rest } = changes;

    const updated: Partial<User> = { ...rest };

    if (rest.email !== undefined && rest.email !== user.email) {
      const clash = await this.findByEmail(rest.email);
      if (clash) {
        throw new ConflictException(
          'An account with this email already exists',
        );
      }
    }

    if (password !== undefined) {
      if (!oldPassword) {
        throw new UnauthorizedException(
          'The current password is required to set a new one',
        );
      }
      await this.verifyPassword(oldPassword, user.password);
      updated.password = await this.hashPassword(password);
    }

    return this.usersRepository.save({ ...user, ...updated });
  }

  async verifyPassword(plain: string, hashed: string): Promise<void> {
    if (!(await compare(plain, hashed))) {
      throw new UnauthorizedException('Invalid email or password');
    }
  }

  async hashPassword(password: string): Promise<string> {
    const salt = await genSalt(BCRYPT_ROUNDS);
    return hash(password, salt);
  }
}
