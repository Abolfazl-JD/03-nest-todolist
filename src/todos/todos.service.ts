import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CategoriesService } from '../categories/categories.service';
import { CreateTodoDto } from './dtos/create-todo.dto';
import { QueryTodosDto } from './dtos/query-todos.dto';
import { UpdateTodoDto } from './dtos/update-todo.dto';
import { Todo } from './todo.entity';

export interface PaginatedTodos {
  data: Todo[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class TodosService {
  constructor(
    @InjectRepository(Todo) private readonly todosRepository: Repository<Todo>,
    private readonly categoriesService: CategoriesService,
  ) {}

  async getTodos(
    ownerId: number,
    query: QueryTodosDto,
  ): Promise<PaginatedTodos> {
    const { page, limit, done, priority, categoryId, search, sortBy, order } =
      query;

    const qb = this.todosRepository
      .createQueryBuilder('todo')
      .leftJoinAndSelect('todo.category', 'category')
      .where('todo.userId = :ownerId', { ownerId });

    if (done !== undefined) {
      qb.andWhere('todo.done = :done', { done });
    }
    if (priority !== undefined) {
      qb.andWhere('todo.priority = :priority', { priority });
    }
    if (categoryId !== undefined) {
      qb.andWhere('todo.categoryId = :categoryId', { categoryId });
    }
    if (search) {
      qb.andWhere('todo.title LIKE :search', { search: `%${search}%` });
    }

    if (sortBy === 'priority') {
      qb.addSelect(
        `CASE todo.priority WHEN 'high' THEN 2 WHEN 'medium' THEN 1 ELSE 0 END`,
        'priority_rank',
      ).orderBy('priority_rank', order);
    } else {
      qb.orderBy(`todo.${sortBy}`, order);
    }

    const [data, total] = await qb
      .offset((page - 1) * limit)
      .limit(limit)
      .getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async addTodo(taskInfo: CreateTodoDto, ownerId: number): Promise<Todo> {
    const { categoryId, dueDate, ...rest } = taskInfo;

    const newTask = this.todosRepository.create({
      ...rest,
      dueDate: dueDate ? new Date(dueDate) : null,
      user: { id: ownerId },
      category: await this.resolveCategory(categoryId, ownerId),
    });

    return this.todosRepository.save(newTask);
  }

  async getSingleTodo(todoId: number, ownerId: number): Promise<Todo> {
    const todo = await this.todosRepository.findOne({
      where: { id: todoId, user: { id: ownerId } },
      relations: { category: true },
    });
    if (!todo) {
      throw new NotFoundException(`No task found with id ${todoId}`);
    }
    return todo;
  }

  async updateTodo(
    todoId: number,
    taskInfo: UpdateTodoDto,
    ownerId: number,
  ): Promise<Todo> {
    const todo = await this.getSingleTodo(todoId, ownerId);
    const { categoryId, dueDate, ...rest } = taskInfo;

    Object.assign(todo, rest);

    if (dueDate !== undefined) {
      todo.dueDate = dueDate === null ? null : new Date(dueDate);
    }
    if (categoryId !== undefined) {
      todo.category = await this.resolveCategory(categoryId, ownerId);
    }

    return this.todosRepository.save(todo);
  }

  async deleteTodo(todoId: number, ownerId: number): Promise<void> {
    const todo = await this.getSingleTodo(todoId, ownerId);
    await this.todosRepository.remove(todo);
  }

  private async resolveCategory(
    categoryId: number | null | undefined,
    ownerId: number,
  ) {
    if (categoryId === undefined || categoryId === null) {
      return null;
    }
    return this.categoriesService.getCategory(categoryId, ownerId);
  }
}
