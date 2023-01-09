import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { User } from '../users/user.entity';
import { AuthGuard } from '../guards/auth.guard';
import { CreateTodo } from './dtos/create-todo.dto';
import { UpdateTodo } from './dtos/update-todo.dto';
import { TodosService } from './todos.service';
import { CurrentUser } from '../decorators/current-user.decorator';
import { Serialize } from '../interceptors/serialize.interceptor';
import { TodoDto } from './dtos/todo.dto';

@Controller('/api/v1/todos')
@UseGuards(new AuthGuard())
@Serialize(TodoDto)
export class TodosController {
    constructor(private todosService: TodosService){}

    @Get()
    getTodos(@CurrentUser() user: User) {
        return this.todosService.getTodos(user)
    }

    @Post()
    addTodo(@Body() taskInfo : CreateTodo, @CurrentUser() user: User) {
        return this.todosService.addTodo(taskInfo, user)
    }

    @Get('/:id')
    getSingleTodos(@Param('id') id: string) {
        return this.todosService.getSingleTodo(id)
    }

    @Patch('/:id')
    updateTodo(@Param('id') id: string, @Body() taskInfo: UpdateTodo) {
        return this.todosService.updateTodo(id, taskInfo)
    }

    @Delete('/:id')
    deleteTodo(@Param('id') id: string) {
        return this.todosService.deleteTodo(id)
    }
}
