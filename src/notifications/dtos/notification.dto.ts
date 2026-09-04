import { Expose, Type } from 'class-transformer';

import { NotificationType } from '../notification-type.enum';
import { NotificationTodoRefDto } from './notification-todo-ref.dto';

export class NotificationDto {
  @Expose()
  id: number;

  @Expose()
  type: NotificationType;

  @Expose()
  message: string;

  @Expose()
  readAt: Date | null;

  @Expose()
  createdAt: Date;

  @Expose()
  @Type(() => NotificationTodoRefDto)
  todo: NotificationTodoRefDto | null;
}
