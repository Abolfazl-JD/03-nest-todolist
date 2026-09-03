import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { Category } from '../categories/category.entity';
import { User } from '../users/user.entity';
import { TodoPriority } from './todo-priority.enum';

@Entity('todos')
export class Todo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 52 })
  title: string;

  @Column({ type: 'boolean', default: false })
  done: boolean;

  @Column({ type: 'varchar', length: 10, default: TodoPriority.Medium })
  priority: TodoPriority;

  @Column({ type: 'datetime', nullable: true })
  dueDate: Date | null;

  @ManyToOne(() => User, (user) => user.todos, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  user: User;

  @ManyToOne(() => Category, (category) => category.todos, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  category: Category | null;
}
