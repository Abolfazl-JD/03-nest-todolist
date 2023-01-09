import { IsNotEmpty } from "class-validator";

export class CreateTodo {
    @IsNotEmpty()
    title: string
}