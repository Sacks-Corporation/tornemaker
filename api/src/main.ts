import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global validation pipe — uses class-validator + class-transformer to
  // validate and transform incoming request bodies.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strip properties not in DTO
      forbidNonWhitelisted: true,
      transform: true, // auto-transform payloads to DTO instances
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
