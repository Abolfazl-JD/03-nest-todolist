import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { createTestApp, registerUser } from './utils/create-test-app';

describe('Authentication (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  const signup = (body: Record<string, unknown>) =>
    request(app.getHttpServer()).post('/api/v1/auth/signup').send(body);

  const login = (body: Record<string, unknown>) =>
    request(app.getHttpServer()).post('/api/v1/auth/login').send(body);

  it('registers a user and returns a token', async () => {
    const response = await signup({
      username: 'ann',
      email: 'ann@example.com',
      password: 'password123',
    }).expect(201);

    expect(response.body.accessToken).toEqual(expect.any(String));
    expect(response.body.user).toEqual({
      id: expect.any(Number),
      username: 'ann',
      email: 'ann@example.com',
    });
  });

  it('never includes the password in a response', async () => {
    const response = await signup({
      username: 'leak',
      email: 'leak@example.com',
      password: 'password123',
    }).expect(201);

    expect(JSON.stringify(response.body)).not.toContain('password123');
    expect(response.body.user).not.toHaveProperty('password');
  });

  it('rejects a duplicate email with 409', async () => {
    await signup({
      username: 'dup',
      email: 'dup@example.com',
      password: 'password123',
    }).expect(201);

    await signup({
      username: 'dup2',
      email: 'dup@example.com',
      password: 'password123',
    }).expect(409);
  });

  it('treats email as case-insensitive for both duplicates and login', async () => {
    await signup({
      username: 'casey',
      email: 'Casey@Example.com',
      password: 'password123',
    }).expect(201);

    await signup({
      username: 'casey2',
      email: 'casey@example.com',
      password: 'password123',
    }).expect(409);

    await login({
      email: 'CASEY@EXAMPLE.COM',
      password: 'password123',
    }).expect(200);
  });

  it('rejects a weak or malformed signup with 400', async () => {
    await signup({
      username: 'x',
      email: 'not-an-email',
      password: 'password123',
    }).expect(400);

    await signup({
      username: 'x',
      email: 'short@example.com',
      password: 'short',
    }).expect(400);
  });

  it('logs in with the right password and rejects the wrong one', async () => {
    await signup({
      username: 'log',
      email: 'log@example.com',
      password: 'password123',
    }).expect(201);

    await login({ email: 'log@example.com', password: 'password123' }).expect(
      200,
    );
    await login({ email: 'log@example.com', password: 'wrongpassword' }).expect(
      401,
    );
  });

  it('gives the same answer for an unknown email as for a wrong password', async () => {
    const unknown = await login({
      email: 'nobody@example.com',
      password: 'password123',
    }).expect(401);

    await signup({
      username: 'known',
      email: 'known@example.com',
      password: 'password123',
    }).expect(201);
    const wrongPassword = await login({
      email: 'known@example.com',
      password: 'wrongpassword',
    }).expect(401);

    expect(unknown.body.message).toBe(wrongPassword.body.message);
  });

  describe('/users/me', () => {
    it('requires a token', async () => {
      await request(app.getHttpServer()).get('/api/v1/users/me').expect(401);
    });

    it('rejects a malformed token', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/users/me')
        .set('Authorization', 'Bearer not-a-real-token')
        .expect(401);
    });

    it('returns the authenticated user', async () => {
      const user = await registerUser(app, 'me@example.com');

      const response = await request(app.getHttpServer())
        .get('/api/v1/users/me')
        .set(...user.auth)
        .expect(200);

      expect(response.body).toEqual({
        id: user.id,
        username: 'me',
        email: 'me@example.com',
      });
    });

    it('refuses a password change without the current password', async () => {
      const user = await registerUser(app, 'pw@example.com');

      await request(app.getHttpServer())
        .patch('/api/v1/users/me')
        .set(...user.auth)
        .send({ password: 'a-brand-new-password' })
        .expect(400);

      await login({ email: 'pw@example.com', password: 'password123' }).expect(
        200,
      );
    });

    it('changes the password when the current one is supplied', async () => {
      const user = await registerUser(app, 'change@example.com');

      await request(app.getHttpServer())
        .patch('/api/v1/users/me')
        .set(...user.auth)
        .send({ password: 'a-brand-new-password', oldPassword: 'password123' })
        .expect(200);

      await login({
        email: 'change@example.com',
        password: 'a-brand-new-password',
      }).expect(200);
      await login({
        email: 'change@example.com',
        password: 'password123',
      }).expect(401);
    });
  });
});
