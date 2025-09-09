import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole, UserStatus } from '../../auth/entities/user.entity';

export async function seedUsers(dataSource: DataSource): Promise<void> {
    const userRepository = dataSource.getRepository(User);

    // Check if admin already exists
    const existingAdmin = await userRepository.findOne({
        where: { email: 'admin@platform.local' }
    });

    if (existingAdmin) {
        console.log('✅ Admin user already exists, skipping user seeding');
        return;
    }

    console.log('🌱 Seeding users...');

    // Hash passwords
    const adminPasswordHash = await bcrypt.hash('admin123!@#', 12);
    const volunteerPasswordHash = await bcrypt.hash('volunteer123!@#', 12);

    // Create admin user
    const adminUser = userRepository.create({
        email: 'admin@platform.local',
        passwordHash: adminPasswordHash,
        name: 'Platform Administrator',
        phone: '+6281234567890',
        roles: [UserRole.ADMIN],
        status: UserStatus.ACTIVE,
        emailVerifiedAt: new Date(),
        phoneVerifiedAt: new Date(),
    });

    // Create sample volunteer user
    const volunteerUser = userRepository.create({
        email: 'volunteer@platform.local',
        passwordHash: volunteerPasswordHash,
        name: 'Sample Volunteer',
        phone: '+6281234567891',
        roles: [UserRole.VOLUNTEER],
        status: UserStatus.ACTIVE,
        emailVerifiedAt: new Date(),
        phoneVerifiedAt: new Date(),
    });

    // Create sample public user
    const publicUser = userRepository.create({
        email: 'public@platform.local',
        passwordHash: volunteerPasswordHash,
        name: 'Sample Public User',
        phone: '+6281234567892',
        roles: [UserRole.PUBLIC],
        status: UserStatus.ACTIVE,
        emailVerifiedAt: new Date(),
    });

    await userRepository.save([adminUser, volunteerUser, publicUser]);

    console.log('✅ Users seeded successfully');
    console.log('📧 Admin credentials: admin@platform.local / admin123!@#');
    console.log('📧 Volunteer credentials: volunteer@platform.local / volunteer123!@#');
    console.log('📧 Public credentials: public@platform.local / volunteer123!@#');
}