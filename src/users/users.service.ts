import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoginUserDto } from './dtos/login-user.dto';
import { RegisterUserDto } from './dtos/register-user.dto';
import { User } from './user.entity';
import { compare, genSalt, hash } from 'bcrypt'
import { UpdateUserDto } from './dtos/update-user.dto';

@Injectable()
export class UsersService {

    constructor(@InjectRepository(User) private usersRepository: Repository<User>){}

    async registerUser(userInfo: RegisterUserDto) {
        userInfo.password = await this.encryptPassword(userInfo.password)
        return this.usersRepository.save(userInfo)
    }

    async loginUser(userInfo: LoginUserDto) {
        const { gmail, password } = userInfo
        if (!gmail || !password) throw new BadRequestException('Invalid credentials')
        
        const user = await this.usersRepository.findOneBy({ gmail })
        if (!user) throw new UnauthorizedException('there is no account with this gmail')
        
        await this.checkPassword(password, user.password)
        
        return user
    }

    async updateUser(userId: number, updatedUser: UpdateUserDto) {
        const { oldPassword } = updatedUser
        // find the user
        const user = await this.getSingleUserById(userId)
        // check the old password if try to edit password
        if (oldPassword) {
            await this.checkPassword(oldPassword, user.password)
            updatedUser.password = await this.encryptPassword(updatedUser.password)
        }
        // edit user
        return this.usersRepository.save({...user, ...updatedUser})
    }

    async checkPassword(passToCheck: string, encryptedPass: string) {
        const isPasswordCorrect = await compare(passToCheck, encryptedPass)
        if(!isPasswordCorrect) throw new UnauthorizedException('password incorrect')
    }

    async encryptPassword(password: string) {
        const salt = await genSalt(10)
        return hash(password, salt)
    }

    async getSingleUserById(id: number) {
        const user = await this.usersRepository.findOneBy({ id })
        if (!user) throw new NotFoundException(`user with id ${id} wasnot found`)
        return user
    }
}
