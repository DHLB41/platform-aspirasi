import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD } from '@nestjs/core';

import databaseConfig from './config/database.config';
import redisConfig from './config/redis.config';
import authConfig from './config/auth.config';
import appConfig from './config/app.config';

import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';


import { VolunteersModule } from './modules/volunteers/volunteers.module';
import { WorkAreasModule } from './modules/work-areas/work-areas.module';
import { MediaModule } from './modules/media/media.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [databaseConfig, redisConfig, authConfig, appConfig],
      envFilePath: ['.env.local', '.env'],
    }),

    // Database
    TypeOrmModule.forRootAsync({
      useFactory: databaseConfig,
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,  // 1 second
        limit: 3,   // 3 requests per second
      },
      {
        name: 'medium', 
        ttl: 10000, // 10 seconds
        limit: 20,  // 20 requests per 10 seconds
      },
      {
        name: 'long',
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),

    // Events
    EventEmitterModule.forRoot(),

    // Scheduling
    ScheduleModule.forRoot(),

    // Feature modules
    AuthModule,
    HealthModule,

    // Volunteers management module
    VolunteersModule,
    WorkAreasModule,
    MediaModule,
  ],
  providers: [
    // Throttling guard (should be first)
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // Authentication guard
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // Authorization guard (should be last)
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}