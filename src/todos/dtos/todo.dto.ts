import { Expose } from "class-transformer"

export class TodoDto {
    @Expose()
    id: number

    @Expose()
    title: string

    @Expose()
    done: boolean

}