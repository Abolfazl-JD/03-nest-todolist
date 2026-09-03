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
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
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
import { CreateTodoDto } from './dtos/create-todo.dto';
import { PaginatedTodosDto } from './dtos/paginated-todos.dto';
import { QueryTodosDto } from './dtos/query-todos.dto';
import { TodoDto } from './dtos/todo.dto';
import { UpdateTodoDto } from './dtos/update-todo.dto';
import { TodosService } from './todos.service';

const NOT_FOUND = {
  description: 'No such todo belongs to the authenticated user',
};

@ApiTags('Todos')
@ApiBearerAuth()
@Controller('todos')
@UseGuards(JwtAuthGuard)
export class TodosController {
  constructor(private readonly todosService: TodosService) {}

  @Get()
  @Serialize(PaginatedTodosDto)
  @ApiOperation({ summary: "List the authenticated user's todos" })
  @ApiOkResponse({ type: PaginatedTodosDto })
  getTodos(@Query() query: QueryTodosDto, @CurrentUser() user: User) {
    return this.todosService.getTodos(user.id, query);
  }

  @Post()
  @Serialize(TodoDto)
  @ApiOperation({ summary: 'Create a todo' })
  @ApiCreatedResponse({ type: TodoDto })
  @ApiNotFoundResponse({ description: 'The given categoryId is not yours' })
  addTodo(@Body() taskInfo: CreateTodoDto, @CurrentUser() user: User) {
    return this.todosService.addTodo(taskInfo, user.id);
  }

  @Get(':id')
  @Serialize(TodoDto)
  @ApiOperation({ summary: 'Return a single todo' })
  @ApiOkResponse({ type: TodoDto })
  @ApiNotFoundResponse(NOT_FOUND)
  getSingleTodo(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ) {
    return this.todosService.getSingleTodo(id, user.id);
  }

  @Patch(':id')
  @Serialize(TodoDto)
  @ApiOperation({ summary: 'Update a todo' })
  @ApiOkResponse({ type: TodoDto })
  @ApiNotFoundResponse(NOT_FOUND)
  updateTodo(
    @Param('id', ParseIntPipe) id: number,
    @Body() taskInfo: UpdateTodoDto,
    @CurrentUser() user: User,
  ) {
    return this.todosService.updateTodo(id, taskInfo, user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a todo' })
  @ApiNoContentResponse({ description: 'Deleted' })
  @ApiNotFoundResponse(NOT_FOUND)
  deleteTodo(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User) {
    return this.todosService.deleteTodo(id, user.id);
  }
}
