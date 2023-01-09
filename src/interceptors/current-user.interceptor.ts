import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { UsersService } from './../users/users.service';

@Injectable()
export class CurrentUserInterceptor implements NestInterceptor {
    constructor(private usersService : UsersService){}

  async intercept(context: ExecutionContext, next: CallHandler<any>) {
      const request = context.switchToHttp().getRequest()
      const { userId } = request.session || {}

      if (userId) {
          const user = await this.usersService.getSingleUserById(userId)
          request.currentUser = user
      }

      return next.handle()
  }
}