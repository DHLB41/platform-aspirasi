import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { resolve } from 'path';
import { seedUsers } from './01-users.seed';

// Load environment variables
config({ path: resolve(__dirname, '../../../.env') });

async function runSeeds() {
    const dataSource = new DataSource({
        type: 'postgres',
        host: process.env.DATABASE_HOST || 'localhost',
        port: parseInt(process.env.DATABASE_PORT) || 5432,
        username: process.env.DATABASE_USERNAME || 'platform_user',
        password: process.env.DATABASE_PASSWORD || 'dev_password_2024',
        database: process.env.DATABASE_NAME || 'platform_dev',
        entities: [__dirname + '/../../**/*.entity{.ts,.js}'],
        synchronize: false,
        logging: false,
    });

    try {
        await dataSource.initialize();
        console.log('🔗 Database connected for seeding');

        // Run seeds in order
        await seedUsers(dataSource);

        console.log('🌱 All seeds completed successfully!');
    } catch (error) {
        console.error('❌ Error running seeds:', error);
        process.exit(1);
    } finally {
        await dataSource.destroy();
        console.log('🔌 Database connection closed');
        process.exit(0);
    }
}

// Run if called directly
if (require.main === module) {
    runSeeds();
}