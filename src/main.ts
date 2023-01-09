import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
const cookieSession = require('cookie-session')

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieSession({
    keys : ['82f_-#1ff4fffs/b,;dahduidfa*^$jkdaad81']
  }))
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }))
  await app.listen(3000);
}
bootstrap();
