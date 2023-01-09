import { IsEmail, IsNotEmpty, MaxLength, MinLength } from "class-validator";

export class LoginUserDto {
    @IsNotEmpty()
    @IsEmail()
    gmail: string

    @IsNotEmpty()
    @MinLength(8)
    @MaxLength(30)
    password: string
}