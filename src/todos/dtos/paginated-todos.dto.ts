import { Expose, Type } from 'class-transformer';

import { TodoDto } from './todo.dto';

export class PaginatedTodosDto {
  @Expose()
  @Type(() => TodoDto)
  data: TodoDto[];

  @Expose()
  total: number;

  @Expose()
  page: number;

  @Expose()
  limit: number;

  @Expose()
  totalPages: number;
}
