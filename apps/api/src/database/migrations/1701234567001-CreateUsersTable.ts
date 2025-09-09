import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateUsersTable1701234567001 implements MigrationInterface {
    name = 'CreateUsersTable1701234567001';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create users table
        await queryRunner.createTable(
            new Table({
                name: 'users',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        generationStrategy: 'uuid',
                        default: 'uuid_generate_v4()',
                    },
                    {
                        name: 'email',
                        type: 'varchar',
                        length: '255',
                        isUnique: true,
                        isNullable: false,
                    },
                    {
                        name: 'password_hash',
                        type: 'varchar',
                        length: '255',
                        isNullable: true,
                    },
                    {
                        name: 'name',
                        type: 'varchar',
                        length: '255',
                        isNullable: false,
                    },
                    {
                        name: 'phone',
                        type: 'varchar',
                        length: '20',
                        isNullable: true,
                    },
                    {
                        name: 'roles',
                        type: 'text',
                        default: "'volunteer'",
                        isNullable: false,
                    },
                    {
                        name: 'status',
                        type: 'enum',
                        enum: ['active', 'inactive', 'suspended'],
                        default: "'active'",
                        isNullable: false,
                    },
                    {
                        name: 'email_verified_at',
                        type: 'timestamp',
                        isNullable: true,
                    },
                    {
                        name: 'phone_verified_at',
                        type: 'timestamp',
                        isNullable: true,
                    },
                    {
                        name: 'last_login_at',
                        type: 'timestamp',
                        isNullable: true,
                    },
                    {
                        name: 'created_at',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                        isNullable: false,
                    },
                    {
                        name: 'updated_at',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                        onUpdate: 'CURRENT_TIMESTAMP',
                        isNullable: false,
                    },
                    {
                        name: 'deleted_at',
                        type: 'timestamp',
                        isNullable: true,
                    },
                    {
                        name: 'version',
                        type: 'integer',
                        default: 1,
                        isNullable: false,
                    },
                ],
                indices: [
                    {
                        name: 'IDX_users_email',
                        columnNames: ['email'],
                    },
                    {
                        name: 'IDX_users_phone',
                        columnNames: ['phone'],
                    },
                    {
                        name: 'IDX_users_status',
                        columnNames: ['status'],
                    },
                ],
            }),
            true,
        );

        // Create refresh_tokens table
        await queryRunner.createTable(
            new Table({
                name: 'refresh_tokens',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        generationStrategy: 'uuid',
                        default: 'uuid_generate_v4()',
                    },
                    {
                        name: 'user_id',
                        type: 'uuid',
                        isNullable: false,
                    },
                    {
                        name: 'token_hash',
                        type: 'varchar',
                        length: '255',
                        isNullable: false,
                    },
                    {
                        name: 'expires_at',
                        type: 'timestamp',
                        isNullable: false,
                    },
                    {
                        name: 'revoked_at',
                        type: 'timestamp',
                        isNullable: true,
                    },
                    {
                        name: 'user_agent',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'ip_address',
                        type: 'inet',
                        isNullable: true,
                    },
                    {
                        name: 'created_at',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                        isNullable: false,
                    },
                    {
                        name: 'updated_at',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                        onUpdate: 'CURRENT_TIMESTAMP',
                        isNullable: false,
                    },
                    {
                        name: 'deleted_at',
                        type: 'timestamp',
                        isNullable: true,
                    },
                    {
                        name: 'version',
                        type: 'integer',
                        default: 1,
                        isNullable: false,
                    },
                ],
                indices: [
                    {
                        name: 'IDX_refresh_tokens_token_hash',
                        columnNames: ['token_hash'],
                    },
                    {
                        name: 'IDX_refresh_tokens_expires_at',
                        columnNames: ['expires_at'],
                    },
                    {
                        name: 'IDX_refresh_tokens_user_id',
                        columnNames: ['user_id'],
                    },
                ],
                foreignKeys: [
                    {
                        columnNames: ['user_id'],
                        referencedTableName: 'users',
                        referencedColumnNames: ['id'],
                        onDelete: 'CASCADE',
                        onUpdate: 'CASCADE',
                    },
                ],
            }),
            true,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop tables (indexes and foreign keys are dropped automatically)
        await queryRunner.dropTable('refresh_tokens');
        await queryRunner.dropTable('users');
    }
}