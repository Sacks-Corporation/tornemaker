import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // All routes are served under /api (e.g. /api/auth/google), matching the
  // frontend's configured API base URL.
  app.setGlobalPrefix('api');

  // Allow the frontend origins to call this API with credentials/headers.
  // Defaults cover both the public site (web/, 5173) and the backoffice
  // (backoffice/, 5174). CORS_ORIGIN can override with a comma-separated list.
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',').map((o) => o.trim()) ?? [
      'http://localhost:5173',
      'http://localhost:5174',
    ],
  });

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
void bootstrap();
