import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { NotificationsService } from '../src/notifications/notifications.service';
import { TestUser, createTestApp, registerUser } from './utils/create-test-app';

describe('Notifications (e2e)', () => {
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

  const runScan = () => app.get(NotificationsService).scanDueDates();

  it('requires authentication', async () => {
    await api().get('/api/v1/notifications').expect(401);
    await api().patch('/api/v1/notifications/1/read').expect(401);
  });

  it('sends a welcome notification on signup', async () => {
    const carol = await registerUser(app, 'carol@example.com');

    const response = await api()
      .get('/api/v1/notifications')
      .set(...carol.auth)
      .expect(200);

    expect(response.body.data).toEqual([
      expect.objectContaining({ type: 'welcome', todo: null }),
    ]);
  });

  describe('due-date scan', () => {
    it('creates an overdue notification for a past-due todo', async () => {
      const todo = await createTodo(alice, {
        title: 'overdue task',
        dueDate: '2020-01-01T00:00:00.000Z',
      });

      await runScan();

      const response = await api()
        .get('/api/v1/notifications?type=overdue')
        .set(...alice.auth)
        .expect(200);

      expect(response.body.data).toEqual([
        expect.objectContaining({
          type: 'overdue',
          todo: { id: todo.id },
        }),
      ]);
    });

    it('replaces the reminder with a completion notice once the todo is done', async () => {
      const todo = await createTodo(alice, {
        title: 'finish me',
        dueDate: '2020-01-01T00:00:00.000Z',
      });
      await runScan();

      await api()
        .patch(`/api/v1/todos/${todo.id}`)
        .set(...alice.auth)
        .send({ done: true })
        .expect(200);

      const response = await api()
        .get('/api/v1/notifications')
        .set(...alice.auth)
        .expect(200);

      const forThisTodo = response.body.data.filter(
        (n: { todo: { id: number } | null }) => n.todo?.id === todo.id,
      );
      expect(forThisTodo).toEqual([
        expect.objectContaining({ type: 'todo_completed' }),
      ]);
    });

    it('does not duplicate a reminder on a second scan', async () => {
      await createTodo(alice, {
        title: 'stays overdue',
        dueDate: '2020-01-01T00:00:00.000Z',
      });

      await runScan();
      const before = await api()
        .get('/api/v1/notifications?type=overdue&limit=100')
        .set(...alice.auth)
        .expect(200);

      await runScan();
      const after = await api()
        .get('/api/v1/notifications?type=overdue&limit=100')
        .set(...alice.auth)
        .expect(200);

      expect(after.body.total).toBe(before.body.total);
    });
  });

  describe('read state', () => {
    let notificationId: number;

    beforeAll(async () => {
      const list = await api()
        .get('/api/v1/notifications')
        .set(...alice.auth)
        .expect(200);
      notificationId = list.body.data[0].id;
    });

    it('marks a single notification as read', async () => {
      const response = await api()
        .patch(`/api/v1/notifications/${notificationId}/read`)
        .set(...alice.auth)
        .expect(200);

      expect(response.body.readAt).not.toBeNull();
    });

    it('excludes read notifications when unreadOnly is set', async () => {
      const response = await api()
        .get('/api/v1/notifications?unreadOnly=true&limit=100')
        .set(...alice.auth)
        .expect(200);

      const ids = response.body.data.map((n: { id: number }) => n.id);
      expect(ids).not.toContain(notificationId);
    });

    it('marks everything read in one call', async () => {
      const response = await api()
        .patch('/api/v1/notifications/read-all')
        .set(...alice.auth)
        .expect(200);

      expect(response.body.updated).toBeGreaterThan(0);

      const list = await api()
        .get('/api/v1/notifications?unreadOnly=true')
        .set(...alice.auth)
        .expect(200);
      expect(list.body.total).toBe(0);
    });
  });

  describe('delete', () => {
    it('removes a notification, after which it is 404', async () => {
      const todo = await createTodo(alice, {
        title: 'to be forgotten',
        dueDate: '2020-01-01T00:00:00.000Z',
      });
      await runScan();
      const created = await api()
        .get('/api/v1/notifications?limit=100')
        .set(...alice.auth)
        .expect(200);
      const target = created.body.data.find(
        (n: { todo: { id: number } | null }) => n.todo?.id === todo.id,
      );

      await api()
        .delete(`/api/v1/notifications/${target.id}`)
        .set(...alice.auth)
        .expect(204);

      await api()
        .patch(`/api/v1/notifications/${target.id}/read`)
        .set(...alice.auth)
        .expect(404);
    });
  });

  describe('cross-user access', () => {
    let aliceNotificationId: number;

    beforeAll(async () => {
      const list = await api()
        .get('/api/v1/notifications')
        .set(...alice.auth)
        .expect(200);
      aliceNotificationId = list.body.data[0].id;
    });

    it("does not let another user read alice's notification", async () => {
      await api()
        .patch(`/api/v1/notifications/${aliceNotificationId}/read`)
        .set(...bob.auth)
        .expect(404);
    });

    it("does not let another user delete alice's notification", async () => {
      await api()
        .delete(`/api/v1/notifications/${aliceNotificationId}`)
        .set(...bob.auth)
        .expect(404);
    });

    it("leaves alice's notification untouched after those attempts", async () => {
      const response = await api()
        .get('/api/v1/notifications')
        .set(...alice.auth)
        .expect(200);

      const ids = response.body.data.map((n: { id: number }) => n.id);
      expect(ids).toContain(aliceNotificationId);
    });
  });
});
