import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { QueryFailedError } from 'typeorm';

import { CategoriesService } from './categories.service';
import { Category } from './category.entity';

const OWNER = 1;
const OTHER_OWNER = 2;

describe('CategoriesService', () => {
  let service: CategoriesService;
  let repo: Record<string, jest.Mock>;

  beforeEach(async () => {
    repo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn((dto: Partial<Category>) => dto as Category),
      save: jest.fn((entity: Partial<Category>) =>
        Promise.resolve(entity as Category),
      ),
      remove: jest.fn(() => Promise.resolve()),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        CategoriesService,
        { provide: getRepositoryToken(Category), useValue: repo },
      ],
    }).compile();

    service = moduleRef.get(CategoriesService);
  });

  it('scopes the lookup to the owner', async () => {
    repo.findOne.mockResolvedValue({ id: 3 });

    await service.getCategory(3, OWNER);

    expect(repo.findOne).toHaveBeenCalledWith({
      where: { id: 3, user: { id: OWNER } },
    });
  });

  it("reports another user's category as not found", async () => {
    repo.findOne.mockResolvedValue(null);

    await expect(service.getCategory(3, OTHER_OWNER)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('translates the per-owner unique index into a 409', async () => {
    repo.save.mockRejectedValue(
      new QueryFailedError(
        'INSERT',
        [],
        new Error(
          'UNIQUE constraint failed: categories.userId, categories.name',
        ),
      ),
    );

    await expect(
      service.addCategory({ name: 'University' }, OWNER),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('does not swallow unrelated database errors', async () => {
    repo.save.mockRejectedValue(new Error('disk is full'));

    await expect(
      service.addCategory({ name: 'University' }, OWNER),
    ).rejects.toThrow('disk is full');
  });
});
