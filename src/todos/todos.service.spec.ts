import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { CategoriesService } from '../categories/categories.service';
import { QueryTodosDto } from './dtos/query-todos.dto';
import { Todo } from './todo.entity';
import { TodoPriority } from './todo-priority.enum';
import { TodosService } from './todos.service';

const OWNER = 1;
const OTHER_OWNER = 2;

const createQueryBuilder = (result: [Todo[], number] = [[], 0]) => {
  const qb: Record<string, jest.Mock> = {};
  for (const method of [
    'leftJoinAndSelect',
    'where',
    'andWhere',
    'addSelect',
    'orderBy',
    'offset',
    'limit',
  ]) {
    qb[method] = jest.fn(() => qb);
  }
  qb.getManyAndCount = jest.fn(() => Promise.resolve(result));
  return qb;
};

describe('TodosService', () => {
  let service: TodosService;
  let repo: Record<string, jest.Mock>;
  let categories: { getCategory: jest.Mock };
  let qb: Record<string, jest.Mock>;

  beforeEach(async () => {
    qb = createQueryBuilder();
    repo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn((dto: Partial<Todo>) => dto as Todo),
      save: jest.fn((entity: Partial<Todo>) => Promise.resolve(entity as Todo)),
      remove: jest.fn(() => Promise.resolve()),
      createQueryBuilder: jest.fn(() => qb),
    };
    categories = { getCategory: jest.fn() };

    const moduleRef = await Test.createTestingModule({
      providers: [
        TodosService,
        { provide: getRepositoryToken(Todo), useValue: repo },
        { provide: CategoriesService, useValue: categories },
      ],
    }).compile();

    service = moduleRef.get(TodosService);
  });

  describe('ownership', () => {
    it('scopes the lookup to the owner', async () => {
      repo.findOne.mockResolvedValue({ id: 5 });

      await service.getSingleTodo(5, OWNER);

      expect(repo.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 5, user: { id: OWNER } },
        }),
      );
    });

    it("reports another user's todo as not found, not forbidden", async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(
        service.getSingleTodo(5, OTHER_OWNER),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('will not update a todo it cannot find for this owner', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(
        service.updateTodo(5, { done: true }, OTHER_OWNER),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('will not delete a todo it cannot find for this owner', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.deleteTodo(5, OTHER_OWNER)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(repo.remove).not.toHaveBeenCalled();
    });

    it('resolves a category through the owner-scoped service', async () => {
      categories.getCategory.mockResolvedValue({ id: 9 });

      await service.addTodo({ title: 'task', categoryId: 9 }, OWNER);

      expect(categories.getCategory).toHaveBeenCalledWith(9, OWNER);
    });
  });

  describe('getTodos', () => {
    const query = (overrides: Partial<QueryTodosDto> = {}): QueryTodosDto =>
      Object.assign(new QueryTodosDto(), { page: 1, limit: 10 }, overrides);

    it('always filters by the owner', async () => {
      await service.getTodos(OWNER, query());

      expect(qb.where).toHaveBeenCalledWith('todo.userId = :ownerId', {
        ownerId: OWNER,
      });
    });

    it('applies only the filters that were supplied', async () => {
      await service.getTodos(OWNER, query({ done: false }));

      expect(qb.andWhere).toHaveBeenCalledTimes(1);
      expect(qb.andWhere).toHaveBeenCalledWith('todo.done = :done', {
        done: false,
      });
    });

    it('combines several filters', async () => {
      await service.getTodos(
        OWNER,
        query({ priority: TodoPriority.High, categoryId: 3, search: 'thesis' }),
      );

      expect(qb.andWhere).toHaveBeenCalledTimes(3);
      expect(qb.andWhere).toHaveBeenCalledWith('todo.title LIKE :search', {
        search: '%thesis%',
      });
    });

    it('ranks priority instead of sorting its text', async () => {
      await service.getTodos(OWNER, query({ sortBy: 'priority' }));

      expect(qb.addSelect).toHaveBeenCalledWith(
        expect.stringContaining('CASE todo.priority'),
        'priority_rank',
      );
      expect(qb.orderBy).toHaveBeenCalledWith('priority_rank', 'ASC');
    });

    it('translates page and limit into offset and limit', async () => {
      await service.getTodos(OWNER, query({ page: 3, limit: 5 }));

      expect(qb.offset).toHaveBeenCalledWith(10);
      expect(qb.limit).toHaveBeenCalledWith(5);
    });

    it('reports total pages, and at least one for an empty result', async () => {
      const result = await service.getTodos(OWNER, query());

      expect(result).toMatchObject({ total: 0, page: 1, totalPages: 1 });
    });
  });
});
