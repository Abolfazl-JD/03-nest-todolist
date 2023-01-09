import { Column, Entity, PrimaryGeneratedColumn, OneToMany } from "typeorm";
import { Todo } from "../todos/todo.entity";

@Entity('users')
export class User {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    username: string

    @Column({ unique: true })
    gmail: string

    @Column()
    password: string

    @OneToMany(() => Todo, todo => todo.user)
    todos : Todo[]
}