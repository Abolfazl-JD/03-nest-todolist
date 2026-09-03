import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';

import { Category } from './category.entity';
import { CreateCategoryDto } from './dtos/create-category.dto';
import { UpdateCategoryDto } from './dtos/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoriesRepository: Repository<Category>,
  ) {}

  getCategories(ownerId: number): Promise<Category[]> {
    return this.categoriesRepository.find({
      where: { user: { id: ownerId } },
      order: { name: 'ASC' },
    });
  }

  async getCategory(categoryId: number, ownerId: number): Promise<Category> {
    const category = await this.categoriesRepository.findOne({
      where: { id: categoryId, user: { id: ownerId } },
    });
    if (!category) {
      throw new NotFoundException(`No category found with id ${categoryId}`);
    }
    return category;
  }

  async addCategory(
    details: CreateCategoryDto,
    ownerId: number,
  ): Promise<Category> {
    const category = this.categoriesRepository.create({
      ...details,
      user: { id: ownerId },
    });
    return this.save(category);
  }

  async updateCategory(
    categoryId: number,
    details: UpdateCategoryDto,
    ownerId: number,
  ): Promise<Category> {
    const category = await this.getCategory(categoryId, ownerId);
    return this.save({ ...category, ...details });
  }

  async deleteCategory(categoryId: number, ownerId: number): Promise<void> {
    const category = await this.getCategory(categoryId, ownerId);

    await this.categoriesRepository.remove(category);
  }

  private async save(category: Category): Promise<Category> {
    try {
      return await this.categoriesRepository.save(category);
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        error.message.includes('UNIQUE')
      ) {
        throw new ConflictException(
          `You already have a category named "${category.name}"`,
        );
      }
      throw error;
    }
  }
}
