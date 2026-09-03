import { Expose, Type } from 'class-transformer';

import { CategoryDto } from '../../categories/dtos/category.dto';
import { TodoPriority } from '../todo-priority.enum';

export class TodoDto {
  @Expose()
  id: number;

  @Expose()
  title: string;

  @Expose()
  done: boolean;

  @Expose()
  priority: TodoPriority;

  @Expose()
  dueDate: Date | null;

  @Expose()
  @Type(() => CategoryDto)
  category: CategoryDto | null;
}
