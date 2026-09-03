import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';

export async function createTestApp(): Promise<INestApplication> {
  process.env.DATABASE_PATH = ':memory:';
  process.env.JWT_SECRET = 'test-only-secret-not-used-anywhere-else';
  process.env.JWT_EXPIRES_IN = '1h';

  const { AppModule } = await import('../../src/app.module');
  const { configureApp } = await import('../../src/app.setup');

  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = configureApp(moduleRef.createNestApplication());
  await app.init();
  return app;
}

export interface TestUser {
  token: string;
  auth: [string, string];
  id: number;
}

export async function registerUser(
  app: INestApplication,
  email: string,
): Promise<TestUser> {
  const request = (await import('supertest')).default;

  const response = await request(app.getHttpServer())
    .post('/api/v1/auth/signup')
    .send({ username: email.split('@')[0], email, password: 'password123' })
    .expect(201);

  const token = response.body.accessToken as string;
  return {
    token,
    auth: ['Authorization', `Bearer ${token}`],
    id: response.body.user.id as number,
  };
}
