import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { TournamentsModule } from './tournaments/tournaments.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    // Load .env variables globally so every module can inject ConfigService
    ConfigModule.forRoot({ isGlobal: true }),

    // Connect to MongoDB Atlas via Mongoose, reading the URI from env
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.getOrThrow<string>('DATABASE_URL'),
      }),
    }),

    UsersModule,
    TournamentsModule,
    AuthModule,
  ],
})
export class AppModule {}
