import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import { Serialize } from '../interceptors/serialize.interceptor';
import { User } from '../users/user.entity';
import { NotificationDto } from './dtos/notification.dto';
import { PaginatedNotificationsDto } from './dtos/paginated-notifications.dto';
import { QueryNotificationsDto } from './dtos/query-notifications.dto';
import { NotificationsService } from './notifications.service';

const NOT_FOUND = {
  description: 'No such notification belongs to the authenticated user',
};

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @Serialize(PaginatedNotificationsDto)
  @ApiOperation({ summary: "List the authenticated user's notifications" })
  @ApiOkResponse({ type: PaginatedNotificationsDto })
  getNotifications(
    @Query() query: QueryNotificationsDto,
    @CurrentUser() user: User,
  ) {
    return this.notificationsService.getNotifications(user.id, query);
  }

  @Patch(':id/read')
  @Serialize(NotificationDto)
  @ApiOperation({ summary: 'Mark a notification read' })
  @ApiOkResponse({ type: NotificationDto })
  @ApiNotFoundResponse(NOT_FOUND)
  markAsRead(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User) {
    return this.notificationsService.markAsRead(id, user.id);
  }

  @Patch('read-all')
  @ApiOperation({ summary: "Mark all of the user's unread notifications read" })
  @ApiOkResponse({ description: 'Number of notifications updated' })
  markAllAsRead(@CurrentUser() user: User) {
    return this.notificationsService.markAllAsRead(user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a notification' })
  @ApiNoContentResponse({ description: 'Deleted' })
  @ApiNotFoundResponse(NOT_FOUND)
  deleteNotification(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ) {
    return this.notificationsService.deleteNotification(id, user.id);
  }
}
