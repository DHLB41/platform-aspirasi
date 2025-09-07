import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export default registerAs('database', (): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT, 10) || 5432,
  username: process.env.DATABASE_USERNAME || 'platform_user',
  password: process.env.DATABASE_PASSWORD || 'dev_password_2024',
  database: process.env.DATABASE_NAME || 'platform_dev',
  synchronize: false, // Use migrations in production
  logging: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
  subscribers: [__dirname + '/../database/subscribers/*{.ts,.js}'],
  extra: {
    timezone: 'Asia/Jakarta',
  },
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
}));