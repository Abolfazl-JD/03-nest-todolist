import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('Task Management API')
    .setDescription(
      [
        'A task management REST API built with NestJS, TypeORM and SQLite.',
        '',
        'Every endpoint except signup and login requires a bearer token.',
        'To try the endpoints here: call POST /auth/signup, copy the',
        '`accessToken` from the response, then press **Authorize** above',
        'and paste it in.',
      ].join('\n'),
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });
}
