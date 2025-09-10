import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVolunteerMetadata1757407900000 implements MigrationInterface {
    name = 'AddVolunteerMetadata1757407900000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add metadata column to volunteers table if it doesn't exist
        await queryRunner.query(`
            ALTER TABLE "volunteers" 
            ADD COLUMN IF NOT EXISTS "metadata" jsonb
        `);

        // Set default empty object for existing records
        await queryRunner.query(`
            UPDATE "volunteers" 
            SET "metadata" = '{}' 
            WHERE "metadata" IS NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove metadata column from volunteers table
        await queryRunner.query(`
            ALTER TABLE "volunteers" 
            DROP COLUMN IF EXISTS "metadata"
        `);
    }
}