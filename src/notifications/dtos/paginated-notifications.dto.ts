import { Expose, Type } from 'class-transformer';

import { NotificationDto } from './notification.dto';

export class PaginatedNotificationsDto {
  @Expose()
  @Type(() => NotificationDto)
  data: NotificationDto[];

  @Expose()
  total: number;

  @Expose()
  page: number;

  @Expose()
  limit: number;

  @Expose()
  totalPages: number;
}
