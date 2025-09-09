import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(__dirname, '../../.env') });

const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT) || 5432,
    username: process.env.DATABASE_USERNAME || 'platform_user',
    password: process.env.DATABASE_PASSWORD || 'dev_password_2024',
    database: process.env.DATABASE_NAME || 'platform_dev',
    synchronize: false, // Always false in production
    logging: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    migrations: [__dirname + '/migrations/*{.ts,.js}'],
    subscribers: [__dirname + '/subscribers/*{.ts,.js}'],
    extra: {
        timezone: 'Asia/Jakarta',
    },
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

export default AppDataSource;