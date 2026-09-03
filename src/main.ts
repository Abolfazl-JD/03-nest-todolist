import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { configureApp } from './app.setup';
import { setupSwagger } from './swagger';

async function bootstrap() {
  const app = configureApp(await NestFactory.create(AppModule));
  setupSwagger(app);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`API listening on http://localhost:${port}/api/v1`);
  console.log(`API docs at      http://localhost:${port}/api/docs`);
}
void bootstrap();
