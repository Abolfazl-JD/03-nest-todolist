import { IsOptional } from "class-validator"

export class UpdateTodo {
    @IsOptional()
    title: string

    @IsOptional()
    done: boolean
}