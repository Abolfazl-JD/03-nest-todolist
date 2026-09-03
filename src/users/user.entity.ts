import { Column, Entity, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Category } from '../categories/category.entity';
import { Todo } from '../todos/todo.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  username: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @OneToMany(() => Todo, (todo) => todo.user)
  todos: Todo[];

  @OneToMany(() => Category, (category) => category.user)
  categories: Category[];
}
