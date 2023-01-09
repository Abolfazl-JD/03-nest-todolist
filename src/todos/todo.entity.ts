import { Column, Entity, PrimaryGeneratedColumn, ManyToOne } from "typeorm";
import { User } from "../users/user.entity";

@Entity('todos')
export class Todo{
    @PrimaryGeneratedColumn()
    id: number

    @Column({ type: 'varchar', length: 52 })
    title: string

    @Column({ type: 'boolean', default: false })
    done: boolean
    
    @ManyToOne(() => User, user => user.todos)
    user : User
}