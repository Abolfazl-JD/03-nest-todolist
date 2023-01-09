import { Expose } from "class-transformer"

export class UserDto {
    @Expose()
    username: string

    @Expose()
    gmail: string

    @Expose()
    id: number
}