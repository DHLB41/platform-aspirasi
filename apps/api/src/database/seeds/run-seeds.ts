import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { UserSeeder } from './user.seeder';

// Load environment variables
config();

const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT, 10) || 5432,
    username: process.env.DATABASE_USER || 'platform_user',
    password: process.env.DATABASE_PASSWORD || 'dev_password_2024',
    database: process.env.DATABASE_NAME || 'platform_dev',
    entities: [__dirname + '/../../**/*.entity{.ts,.js}'],
    synchronize: false,
    logging: false,
});

async function runSeeds() {
    try {
        console.log('Initializing database connection...');
        await AppDataSource.initialize();
        console.log('Database connection established');

        console.log('Running database seeds...');

        // Run user seeder
        const userSeeder = new UserSeeder(AppDataSource);
        await userSeeder.run();

        console.log('Database seeding completed successfully!');
    } catch (error) {
        console.error('Error during seeding:', error);
    } finally {
        if (AppDataSource.isInitialized) {
            await AppDataSource.destroy();
        }
    }
}

runSeeds();