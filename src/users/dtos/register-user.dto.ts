import { IsNotEmpty, IsEmail, MinLength, MaxLength, Min } from "class-validator"

export class RegisterUserDto {
    @IsNotEmpty()
    @MinLength(1)
    username: string

    @IsNotEmpty()
    @IsEmail()
    gmail: string

    @IsNotEmpty()
    @MinLength(8)
    @MaxLength(30)
    password: string
}