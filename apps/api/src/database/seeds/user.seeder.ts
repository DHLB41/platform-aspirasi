import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole, UserStatus } from '../../common/entities/user.entity';

export class UserSeeder {
    constructor(private dataSource: DataSource) {}

    async run(): Promise<void> {
        const userRepository = this.dataSource.getRepository(User);

        // Check if admin user already exists
        const existingAdmin = await userRepository.findOne({
            where: { email: 'admin@platform.local' }
        });

        if (existingAdmin) {
            console.log('Admin user already exists. Skipping...');
            return;
        }

        // Create admin user
        const adminPassword = await bcrypt.hash('Admin123', 12);
        const adminUser = userRepository.create({
            email: 'admin@platform.local',
            passwordHash: adminPassword,
            name: 'Platform Administrator',
            phone: '+621234567890',
            roles: [UserRole.ADMIN, UserRole.VOLUNTEER],
            status: UserStatus.ACTIVE,
            emailVerifiedAt: new Date(),
        });

        await userRepository.save(adminUser);
        console.log('Admin user created: admin@platform.local / admin123');

        // Create sample volunteer user
        const volunteerPassword = await bcrypt.hash('Volunteer123', 12);
        const volunteerUser = userRepository.create({
            email: 'volunteer@platform.local',
            passwordHash: volunteerPassword,
            name: 'Sample Volunteer',
            phone: '+621234567891',
            roles: [UserRole.VOLUNTEER],
            status: UserStatus.ACTIVE,
            emailVerifiedAt: new Date(),
        });

        await userRepository.save(volunteerUser);
        console.log('Volunteer user created: volunteer@platform.local / volunteer123');

        // Create sample public user
        const publicUser = userRepository.create({
            email: 'public@platform.local',
            passwordHash: null, // No password for public user
            name: 'Sample Public User',
            roles: [UserRole.PUBLIC],
            status: UserStatus.ACTIVE,
            emailVerifiedAt: new Date(),
        });

        await userRepository.save(publicUser);
        console.log('Public user created: public@platform.local');
    }
}