import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateTodo } from './dtos/create-todo.dto';
import { UpdateTodo } from './dtos/update-todo.dto';
import { Todo } from './todo.entity';
import { User } from './../users/user.entity';

@Injectable()
export class TodosService {

    constructor(@InjectRepository(Todo) private todosRepository: Repository<Todo>){}

    getTodos(currentUser: User) {
        return this.todosRepository.find({
            relations: {
                user : true
            },
            where: {
                user : currentUser
            }
        })
    }

    addTodo(taskInfo: CreateTodo, user: User) {
        const newTask = this.todosRepository.create(taskInfo)
        newTask.user = user
        return this.todosRepository.save(newTask)
    }

    async getSingleTodo(todoId: string) {
        const workTodo = await this.todosRepository.findOneBy({ id : +todoId })
        if(!workTodo) throw new NotFoundException('unable to find this task')
        return workTodo
    }

    async updateTodo(id: string, taskInfo: UpdateTodo) {
        const workTodo = await this.getSingleTodo(id)
        return this.todosRepository.save({...workTodo, ...taskInfo})
    }

    async deleteTodo(id: string) {
        const workTodo = await this.getSingleTodo(id)
        this.todosRepository.remove(workTodo)
        return `task with id ${id} has been successfully deleted`
    }
}
