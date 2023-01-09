import { IsEmail, IsNotEmpty, IsOptional, MaxLength, MinLength } from "class-validator"

export class UpdateUserDto {
    @IsOptional()
    @MinLength(1)
    username: string

    @IsOptional()
    @MinLength(8)
    @MaxLength(30)
    password: string

    @IsOptional()
    @MinLength(8)
    @MaxLength(30)
    oldPassword: string
}