import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const configService = app.get(ConfigService);
  const port = configService.get('PORT') || 3001;
  const apiPrefix = configService.get('API_PREFIX') || 'api/v1';

  // Security middleware
  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }));
  
  // Compression middleware
  app.use(compression());
  
  // CORS configuration
  app.enableCors({
    origin: [
      configService.get('FRONTEND_URL') || 'http://localhost:3000',
      'http://localhost:3000'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // Global pipes for validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // API prefix
  app.setGlobalPrefix(apiPrefix);

  // Swagger documentation
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Platform Aspirasi API')
      .setDescription('API untuk Platform Informasi Publik & Manajemen Relawan')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('auth', 'Authentication & Authorization')
      .addTag('users', 'User Management')
      .addTag('volunteers', 'Volunteer Management')
      .addTag('aspirations', 'Aspiration System')
      .addTag('content', 'Content Management')
      .addTag('kta', 'Digital KTA Cards')
      .addTag('health', 'Health Checks')
      .build();
    
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    });
  }

  await app.listen(port);
  
  Logger.log(`🚀 API running on http://localhost:${port}/${apiPrefix}`, 'Bootstrap');
  
  if (process.env.NODE_ENV !== 'production') {
    Logger.log(`📚 Swagger docs available at http://localhost:${port}/api/docs`, 'Bootstrap');
  }
  
  Logger.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`, 'Bootstrap');
}

bootstrap();