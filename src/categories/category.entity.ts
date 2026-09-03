import {
  Column,
  Entity,
  Index,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Todo } from '../todos/todo.entity';
import { User } from '../users/user.entity';

@Entity('categories')
@Index('UQ_categories_owner_name', ['user', 'name'], { unique: true })
export class Category {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 40 })
  name: string;

  @ManyToOne(() => User, (user) => user.categories, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  user: User;

  @OneToMany(() => Todo, (todo) => todo.category)
  todos: Todo[];
}
