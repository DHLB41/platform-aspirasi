import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD } from '@nestjs/core';

// Configuration
import databaseConfig from './config/database.config';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig],
      envFilePath: ['.env.local', '.env'],
      cache: true,
    }),

    // Database
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        ...configService.get('database'),
      }),
    }),

    // Rate Limiting
    ThrottlerModule.forRoot([{
      name: 'default',
      ttl: 60000, // 1 minute
      limit: 100, // 100 requests per minute
    }, {
      name: 'strict',
      ttl: 60000,
      limit: 20, // 20 requests per minute for sensitive endpoints
    }]),

    // Event System
    EventEmitterModule.forRoot(),

    // Cron Jobs
    ScheduleModule.forRoot(),

    // Feature Modules
    HealthModule,
    AuthModule,

    // Future modules:
    // VolunteersModule,
    // AspirationsModule,
    // ContentModule,
    // KtaModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}