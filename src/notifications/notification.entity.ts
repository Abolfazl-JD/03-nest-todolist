import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Todo } from '../todos/todo.entity';
import { User } from '../users/user.entity';
import { NotificationType } from './notification-type.enum';

@Entity('notifications')
@Index('IDX_notifications_user_created', ['user', 'createdAt'])
@Index('IDX_notifications_todo_type', ['todo', 'type'])
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 20 })
  type: NotificationType;

  @Column({ type: 'varchar', length: 255 })
  message: string;

  @Column({ type: 'datetime', nullable: true })
  readAt: Date | null;

  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.notifications, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  user: User;

  @ManyToOne(() => Todo, { nullable: true, onDelete: 'CASCADE' })
  todo: Todo | null;
}
