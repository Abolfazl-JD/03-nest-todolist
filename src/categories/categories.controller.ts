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
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
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
import { CategoriesService } from './categories.service';
import { CategoryDto } from './dtos/category.dto';
import { CreateCategoryDto } from './dtos/create-category.dto';
import { UpdateCategoryDto } from './dtos/update-category.dto';

@ApiTags('Categories')
@ApiBearerAuth()
@Controller('categories')
@UseGuards(JwtAuthGuard)
@Serialize(CategoryDto)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @ApiOperation({ summary: "List the authenticated user's categories" })
  @ApiOkResponse({ type: [CategoryDto] })
  getCategories(@CurrentUser() user: User) {
    return this.categoriesService.getCategories(user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a category' })
  @ApiCreatedResponse({ type: CategoryDto })
  @ApiConflictResponse({
    description: 'You already have a category with that name',
  })
  addCategory(@Body() details: CreateCategoryDto, @CurrentUser() user: User) {
    return this.categoriesService.addCategory(details, user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Return a single category' })
  @ApiOkResponse({ type: CategoryDto })
  @ApiNotFoundResponse({ description: 'No such category belongs to you' })
  getCategory(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ) {
    return this.categoriesService.getCategory(id, user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Rename a category' })
  @ApiOkResponse({ type: CategoryDto })
  @ApiNotFoundResponse({ description: 'No such category belongs to you' })
  updateCategory(
    @Param('id', ParseIntPipe) id: number,
    @Body() details: UpdateCategoryDto,
    @CurrentUser() user: User,
  ) {
    return this.categoriesService.updateCategory(id, details, user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a category; its todos are kept and detached',
  })
  @ApiNoContentResponse({ description: 'Deleted' })
  @ApiNotFoundResponse({ description: 'No such category belongs to you' })
  deleteCategory(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ) {
    return this.categoriesService.deleteCategory(id, user.id);
  }
}
