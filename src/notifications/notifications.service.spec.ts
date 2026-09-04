import { NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { FindOperator } from 'typeorm';

import { Todo } from '../todos/todo.entity';
import { NotificationType } from './notification-type.enum';
import { Notification } from './notification.entity';
import { NotificationsService } from './notifications.service';

const OWNER = 1;
const OTHER_OWNER = 2;

describe('NotificationsService', () => {
  let service: NotificationsService;
  let repo: Record<string, jest.Mock>;
  let todosRepo: Record<string, jest.Mock>;
  let config: { get: jest.Mock };

  beforeEach(async () => {
    repo = {
      findOne: jest.fn(),
      findAndCount: jest.fn(() => Promise.resolve([[], 0])),
      create: jest.fn((dto: Partial<Notification>) => dto as Notification),
      save: jest.fn((entity: Partial<Notification>) =>
        Promise.resolve(entity as Notification),
      ),
      remove: jest.fn(() => Promise.resolve()),
      update: jest.fn(() => Promise.resolve({ affected: 0 })),
      delete: jest.fn(() => Promise.resolve()),
    };
    todosRepo = {
      find: jest.fn(() => Promise.resolve([])),
    };
    config = { get: jest.fn(() => undefined) };

    const moduleRef = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: getRepositoryToken(Notification), useValue: repo },
        { provide: getRepositoryToken(Todo), useValue: todosRepo },
        { provide: ConfigService, useValue: config },
      ],
    }).compile();

    service = moduleRef.get(NotificationsService);
  });

  describe('scanDueDates', () => {
    const NOW = new Date('2026-06-15T12:00:00.000Z');

    const dueSoonTodo = {
      id: 1,
      title: 'write thesis',
      done: false,
      dueDate: new Date('2026-06-15T18:00:00.000Z'),
      user: { id: OWNER },
    } as Todo;

    const overdueTodo = {
      id: 2,
      title: 'buy milk',
      done: false,
      dueDate: new Date('2026-06-14T00:00:00.000Z'),
      user: { id: OWNER },
    } as Todo;

    const farFutureTodo = {
      id: 3,
      title: 'read paper',
      done: false,
      dueDate: new Date('2026-08-01T00:00:00.000Z'),
      user: { id: OWNER },
    } as Todo;

    it('creates a due_soon notification for a todo inside the window', async () => {
      todosRepo.find.mockResolvedValue([dueSoonTodo]);
      repo.findOne.mockResolvedValue(null);

      await service.scanDueDates(NOW);

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: NotificationType.DueSoon,
          user: { id: OWNER },
          todo: { id: dueSoonTodo.id },
        }),
      );
      expect(repo.save).toHaveBeenCalledTimes(1);
    });

    it('creates an overdue notification, not due_soon, for a past-due todo', async () => {
      todosRepo.find.mockResolvedValue([overdueTodo]);
      repo.findOne.mockResolvedValue(null);

      await service.scanDueDates(NOW);

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ type: NotificationType.Overdue }),
      );
    });

    it('does nothing for a todo far outside the window', async () => {
      todosRepo.find.mockResolvedValue([farFutureTodo]);

      await service.scanDueDates(NOW);

      expect(repo.create).not.toHaveBeenCalled();
    });

    it('queries only not-done todos with a due date set', async () => {
      todosRepo.find.mockResolvedValue([]);

      await service.scanDueDates(NOW);

      expect(todosRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ done: false }),
        }),
      );
    });

    // Regression test: the scan runs every 5 minutes, so it must not create a
    // second due_soon row for a todo that already has one.
    it('does not duplicate a notification that already exists', async () => {
      todosRepo.find.mockResolvedValue([dueSoonTodo]);
      repo.findOne.mockResolvedValue({ id: 99 });

      await service.scanDueDates(NOW);

      expect(repo.create).not.toHaveBeenCalled();
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('respects a configured DUE_SOON_WINDOW_HOURS', async () => {
      config.get.mockImplementation((key: string) =>
        key === 'DUE_SOON_WINDOW_HOURS' ? '1' : undefined,
      );
      todosRepo.find.mockResolvedValue([dueSoonTodo]);
      repo.findOne.mockResolvedValue(null);

      await service.scanDueDates(NOW);

      expect(repo.create).not.toHaveBeenCalled();
    });
  });

  describe('getNotifications', () => {
    it('always scopes to the owner and orders by recency', async () => {
      await service.getNotifications(OWNER, {
        page: 1,
        limit: 10,
      });

      expect(repo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { user: { id: OWNER } },
          order: { createdAt: 'DESC' },
          skip: 0,
          take: 10,
        }),
      );
    });

    it('applies unreadOnly and type filters', async () => {
      await service.getNotifications(OWNER, {
        page: 1,
        limit: 10,
        unreadOnly: true,
        type: NotificationType.DueSoon,
      });

      const call = repo.findAndCount.mock.calls[0][0];
      expect(call.where.user).toEqual({ id: OWNER });
      expect(call.where.type).toBe(NotificationType.DueSoon);
      expect(call.where.readAt).toBeDefined();
    });

    it('translates page/limit into skip/take and reports total pages', async () => {
      repo.findAndCount.mockResolvedValue([[], 25]);

      const result = await service.getNotifications(OWNER, {
        page: 3,
        limit: 10,
      });

      expect(repo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 20, take: 10 }),
      );
      expect(result).toMatchObject({ total: 25, page: 3, totalPages: 3 });
    });
  });

  describe('ownership', () => {
    it('scopes markAsRead to the owner and sets readAt', async () => {
      repo.findOne.mockResolvedValue({ id: 5, readAt: null });

      const result = await service.markAsRead(5, OWNER);

      expect(repo.findOne).toHaveBeenCalledWith({
        where: { id: 5, user: { id: OWNER } },
        relations: { todo: true },
      });
      expect(result.readAt).toBeInstanceOf(Date);
    });

    it("reports another user's notification as not found", async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.markAsRead(5, OTHER_OWNER)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('will not delete a notification it cannot find for this owner', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(
        service.deleteNotification(5, OTHER_OWNER),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(repo.remove).not.toHaveBeenCalled();
    });
  });

  describe('markAllAsRead', () => {
    it("only updates the given owner's unread notifications", async () => {
      repo.update.mockResolvedValue({ affected: 3 });

      const result = await service.markAllAsRead(OWNER);

      expect(repo.update).toHaveBeenCalledWith(
        expect.objectContaining({ user: { id: OWNER } }),
        expect.objectContaining({ readAt: expect.any(Date) }),
      );
      expect(result).toEqual({ updated: 3 });
    });
  });

  describe('clearPendingReminders', () => {
    it('deletes only due-soon/overdue rows for the given todo and owner', async () => {
      await service.clearPendingReminders(7, OWNER);

      expect(repo.delete).toHaveBeenCalledWith(
        expect.objectContaining({
          todo: { id: 7 },
          user: { id: OWNER },
        }),
      );
      const call = repo.delete.mock.calls[0][0];
      const typeFilter = call.type as FindOperator<NotificationType>;
      expect(typeFilter.value).toEqual([
        NotificationType.DueSoon,
        NotificationType.Overdue,
      ]);
    });
  });
});
