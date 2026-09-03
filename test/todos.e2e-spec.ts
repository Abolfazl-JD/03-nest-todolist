import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { TestUser, createTestApp, registerUser } from './utils/create-test-app';

describe('Todos and categories (e2e)', () => {
  let app: INestApplication;
  let alice: TestUser;
  let bob: TestUser;

  beforeAll(async () => {
    app = await createTestApp();
    alice = await registerUser(app, 'alice@example.com');
    bob = await registerUser(app, 'bob@example.com');
  });

  afterAll(async () => {
    await app.close();
  });

  const api = () => request(app.getHttpServer());

  const createTodo = async (user: TestUser, body: Record<string, unknown>) => {
    const response = await api()
      .post('/api/v1/todos')
      .set(...user.auth)
      .send(body)
      .expect(201);
    return response.body;
  };

  const createCategory = async (user: TestUser, name: string) => {
    const response = await api()
      .post('/api/v1/categories')
      .set(...user.auth)
      .send({ name })
      .expect(201);
    return response.body;
  };

  it('requires authentication', async () => {
    await api().get('/api/v1/todos').expect(401);
    await api().post('/api/v1/todos').send({ title: 'x' }).expect(401);
    await api().get('/api/v1/categories').expect(401);
  });

  it('creates a todo with defaults and reads it back', async () => {
    const created = await createTodo(alice, { title: 'write thesis' });

    expect(created).toMatchObject({
      title: 'write thesis',
      done: false,
      priority: 'medium',
      dueDate: null,
      category: null,
    });

    await api()
      .get(`/api/v1/todos/${created.id}`)
      .set(...alice.auth)
      .expect(200);
  });

  it('updates and deletes a todo', async () => {
    const created = await createTodo(alice, { title: 'temporary' });

    await api()
      .patch(`/api/v1/todos/${created.id}`)
      .set(...alice.auth)
      .send({ done: true, priority: 'high' })
      .expect(200)
      .expect((res) => {
        expect(res.body).toMatchObject({ done: true, priority: 'high' });
      });

    await api()
      .delete(`/api/v1/todos/${created.id}`)
      .set(...alice.auth)
      .expect(204);

    await api()
      .get(`/api/v1/todos/${created.id}`)
      .set(...alice.auth)
      .expect(404);
  });

  it('rejects unknown properties and invalid values', async () => {
    await api()
      .post('/api/v1/todos')
      .set(...alice.auth)
      .send({ title: 'x', isAdmin: true })
      .expect(400);

    await api()
      .post('/api/v1/todos')
      .set(...alice.auth)
      .send({ title: 'x', priority: 'urgent' })
      .expect(400);
  });

  describe('cross-user access', () => {
    let aliceTodo: { id: number };
    let aliceCategory: { id: number };

    beforeAll(async () => {
      aliceTodo = await createTodo(alice, { title: "alice's private task" });
      aliceCategory = await createCategory(alice, 'Alice Private');
    });

    it("does not let another user read alice's todo", async () => {
      await api()
        .get(`/api/v1/todos/${aliceTodo.id}`)
        .set(...bob.auth)
        .expect(404);
    });

    it("does not let another user modify alice's todo", async () => {
      await api()
        .patch(`/api/v1/todos/${aliceTodo.id}`)
        .set(...bob.auth)
        .send({ done: true })
        .expect(404);
    });

    it("does not let another user delete alice's todo", async () => {
      await api()
        .delete(`/api/v1/todos/${aliceTodo.id}`)
        .set(...bob.auth)
        .expect(404);
    });

    it('leaves the todo untouched after those attempts', async () => {
      await api()
        .get(`/api/v1/todos/${aliceTodo.id}`)
        .set(...alice.auth)
        .expect(200)
        .expect((res) => {
          expect(res.body).toMatchObject({
            title: "alice's private task",
            done: false,
          });
        });
    });

    it("does not let another user attach a todo to alice's category", async () => {
      await api()
        .post('/api/v1/todos')
        .set(...bob.auth)
        .send({ title: 'sneaky', categoryId: aliceCategory.id })
        .expect(404);
    });

    it("keeps alice's todos out of bob's list", async () => {
      const response = await api()
        .get('/api/v1/todos')
        .set(...bob.auth)
        .expect(200);

      const titles = response.body.data.map((t: { title: string }) => t.title);
      expect(titles).not.toContain("alice's private task");
    });
  });

  describe('categories', () => {
    it('rejects a duplicate name for the same user', async () => {
      await createCategory(alice, 'University');

      await api()
        .post('/api/v1/categories')
        .set(...alice.auth)
        .send({ name: 'University' })
        .expect(409);
    });

    it('allows two users to use the same category name', async () => {
      await api()
        .post('/api/v1/categories')
        .set(...bob.auth)
        .send({ name: 'University' })
        .expect(201);
    });

    it('detaches todos rather than deleting them when a category goes', async () => {
      const category = await createCategory(alice, 'Temporary');
      const todo = await createTodo(alice, {
        title: 'keeps existing',
        categoryId: category.id,
      });

      await api()
        .delete(`/api/v1/categories/${category.id}`)
        .set(...alice.auth)
        .expect(204);

      await api()
        .get(`/api/v1/todos/${todo.id}`)
        .set(...alice.auth)
        .expect(200)
        .expect((res) => {
          expect(res.body.category).toBeNull();
        });
    });
  });

  describe('querying', () => {
    let charlie: TestUser;

    beforeAll(async () => {
      charlie = await registerUser(app, 'charlie@example.com');
      await createTodo(charlie, { title: 'apple task', priority: 'low' });
      await createTodo(charlie, { title: 'banana task', priority: 'high' });
      await createTodo(charlie, { title: 'cherry task', priority: 'medium' });
    });

    const list = (query: string) =>
      api()
        .get(`/api/v1/todos${query}`)
        .set(...charlie.auth)
        .expect(200);

    it('returns a pagination envelope', async () => {
      const response = await list('');

      expect(response.body).toMatchObject({
        total: 3,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });

    it('paginates', async () => {
      const response = await list('?page=2&limit=2');

      expect(response.body.data).toHaveLength(1);
      expect(response.body).toMatchObject({ page: 2, totalPages: 2 });
    });

    it('filters by priority', async () => {
      const response = await list('?priority=high');

      expect(response.body.total).toBe(1);
      expect(response.body.data[0].title).toBe('banana task');
    });

    it('searches by title', async () => {
      const response = await list('?search=cherry');

      expect(response.body.total).toBe(1);
    });

    it('sorts by priority from high to low', async () => {
      const response = await list('?sortBy=priority&order=DESC');

      expect(
        response.body.data.map((t: { priority: string }) => t.priority),
      ).toEqual(['high', 'medium', 'low']);
    });

    it('rejects a sort field that is not allowed', async () => {
      await api()
        .get('/api/v1/todos?sortBy=password')
        .set(...charlie.auth)
        .expect(400);
    });

    it('rejects a page size above the cap', async () => {
      await api()
        .get('/api/v1/todos?limit=5000')
        .set(...charlie.auth)
        .expect(400);
    });
  });
});
