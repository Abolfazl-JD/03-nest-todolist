import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, In, IsNull, Not, Repository } from 'typeorm';

import { Todo } from '../todos/todo.entity';
import { QueryNotificationsDto } from './dtos/query-notifications.dto';
import { NotificationType } from './notification-type.enum';
import { Notification } from './notification.entity';

export interface PaginatedNotifications {
  data: Notification[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const REMINDER_TYPES = [NotificationType.DueSoon, NotificationType.Overdue];
const DEFAULT_DUE_SOON_WINDOW_HOURS = 24;

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationsRepository: Repository<Notification>,
    @InjectRepository(Todo)
    private readonly todosRepository: Repository<Todo>,
    private readonly configService: ConfigService,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  handleDueDateScan(): Promise<void> {
    return this.scanDueDates();
  }

  notifyWelcome(userId: number, username: string): Promise<Notification> {
    const notification = this.notificationsRepository.create({
      type: NotificationType.Welcome,
      message: `Welcome, ${username}!`,
      user: { id: userId },
      todo: null,
    });
    return this.notificationsRepository.save(notification);
  }

  notifyTodoCompleted(todo: Todo, ownerId: number): Promise<Notification> {
    const notification = this.notificationsRepository.create({
      type: NotificationType.TodoCompleted,
      message: `"${todo.title}" was completed`,
      user: { id: ownerId },
      todo: { id: todo.id },
    });
    return this.notificationsRepository.save(notification);
  }

  async scanDueDates(now: Date = new Date()): Promise<void> {
    const configuredWindow = Number(
      this.configService.get('DUE_SOON_WINDOW_HOURS'),
    );
    const windowHours =
      Number.isFinite(configuredWindow) && configuredWindow > 0
        ? configuredWindow
        : DEFAULT_DUE_SOON_WINDOW_HOURS;
    const windowEnd = new Date(now.getTime() + windowHours * 60 * 60 * 1000);

    const candidates = await this.todosRepository.find({
      where: { done: false, dueDate: Not(IsNull()) },
      relations: { user: true },
    });

    for (const todo of candidates) {
      if (!todo.dueDate) {
        continue;
      }

      const type =
        todo.dueDate.getTime() < now.getTime()
          ? NotificationType.Overdue
          : todo.dueDate.getTime() <= windowEnd.getTime()
            ? NotificationType.DueSoon
            : null;

      if (!type) {
        continue;
      }

      const alreadyNotified = await this.notificationsRepository.findOne({
        where: { todo: { id: todo.id }, type },
      });
      if (alreadyNotified) {
        continue;
      }

      const label =
        type === NotificationType.Overdue ? 'is overdue' : 'is due soon';
      const notification = this.notificationsRepository.create({
        type,
        message: `"${todo.title}" ${label}`,
        user: { id: todo.user.id },
        todo: { id: todo.id },
      });
      await this.notificationsRepository.save(notification);
    }
  }

  async getNotifications(
    ownerId: number,
    query: QueryNotificationsDto,
  ): Promise<PaginatedNotifications> {
    const { page, limit, unreadOnly, type } = query;

    const where: FindOptionsWhere<Notification> = { user: { id: ownerId } };
    if (unreadOnly) {
      where.readAt = IsNull();
    }
    if (type !== undefined) {
      where.type = type;
    }

    const [data, total] = await this.notificationsRepository.findAndCount({
      where,
      relations: { todo: true },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async markAsRead(
    notificationId: number,
    ownerId: number,
  ): Promise<Notification> {
    const notification = await this.getOwned(notificationId, ownerId);
    notification.readAt = new Date();
    return this.notificationsRepository.save(notification);
  }

  async markAllAsRead(ownerId: number): Promise<{ updated: number }> {
    const result = await this.notificationsRepository.update(
      { user: { id: ownerId }, readAt: IsNull() },
      { readAt: new Date() },
    );
    return { updated: result.affected ?? 0 };
  }

  async deleteNotification(
    notificationId: number,
    ownerId: number,
  ): Promise<void> {
    const notification = await this.getOwned(notificationId, ownerId);
    await this.notificationsRepository.remove(notification);
  }

  async clearPendingReminders(todoId: number, ownerId: number): Promise<void> {
    await this.notificationsRepository.delete({
      todo: { id: todoId },
      user: { id: ownerId },
      type: In(REMINDER_TYPES),
    });
  }

  private async getOwned(
    notificationId: number,
    ownerId: number,
  ): Promise<Notification> {
    const notification = await this.notificationsRepository.findOne({
      where: { id: notificationId, user: { id: ownerId } },
      relations: { todo: true },
    });
    if (!notification) {
      throw new NotFoundException(
        `No notification found with id ${notificationId}`,
      );
    }
    return notification;
  }
}
