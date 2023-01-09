import { Body, Controller, Get, Param, Patch, Post, Session } from '@nestjs/common';
import { Serialize } from '../interceptors/serialize.interceptor';
import { LoginUserDto } from './dtos/login-user.dto';
import { RegisterUserDto } from './dtos/register-user.dto';
import { UsersService } from './users.service';
import { UserDto } from './dtos/user.dto';
import { UpdateUserDto } from './dtos/update-user.dto';

@Controller('/api/v1/users')
@Serialize(UserDto)
export class UsersController {

    constructor(private usersService: UsersService){}

    @Post('signup')
    async registerUser(@Body() userInfo: RegisterUserDto, @Session() session: Record<string, any>) {
        const newUser = await this.usersService.registerUser(userInfo)
        session.userId = newUser.id
        return newUser
    }

    @Post('login')
    async loginUser(@Body() userInfo: LoginUserDto, @Session() session: Record<string, any>) {
        const loggedInUser = await this.usersService.loginUser(userInfo)
        session.userId = loggedInUser.id
        return loggedInUser
    }

    @Patch(':id')
    updateUser(@Param('id') id: string, @Body() userInfo: UpdateUserDto) {
        return this.usersService.updateUser(+id, userInfo)
    }

    @Post('signout')
    logoutUser(@Session() session: Record<string, any>){
        session.userId = null
        return 'user has successfully signed out'
    }
}
