import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateVolunteerTables1734567890 implements MigrationInterface {
    name = 'CreateVolunteerTables1734567890';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create custom types
        await queryRunner.query(`
            CREATE TYPE volunteer_status_enum AS ENUM (
                'active', 'inactive', 'suspended', 'resigned'
            )
        `);

        await queryRunner.query(`
            CREATE TYPE gender_enum AS ENUM ('male', 'female')
        `);

        await queryRunner.query(`
            CREATE TYPE marital_status_enum AS ENUM (
                'single', 'married', 'divorced', 'widowed'
            )
        `);

        await queryRunner.query(`
            CREATE TYPE work_area_type_enum AS ENUM (
                'village', 'district', 'city', 'province', 'custom'
            )
        `);

        await queryRunner.query(`
            CREATE TYPE work_area_status_enum AS ENUM (
                'active', 'inactive', 'planned'
            )
        `);

        await queryRunner.query(`
            CREATE TYPE relationship_type_enum AS ENUM (
                'spouse', 'child', 'parent', 'sibling', 'grandparent', 
                'grandchild', 'uncle_aunt', 'cousin', 'nephew_niece', 'other'
            )
        `);

        await queryRunner.query(`
            CREATE TYPE family_member_status_enum AS ENUM (
                'active', 'deceased', 'separated'
            )
        `);

        await queryRunner.query(`
            CREATE TYPE media_type_enum AS ENUM (
                'image', 'document', 'video', 'audio'
            )
        `);

        await queryRunner.query(`
            CREATE TYPE media_status_enum AS ENUM (
                'uploaded', 'processing', 'ready', 'failed'
            )
        `);

        await queryRunner.query(`
            CREATE TYPE document_type_enum AS ENUM (
                'ktp', 'kk', 'photo', 'ijazah', 'sertifikat', 
                'surat_sehat', 'skck', 'cv', 'surat_pernyataan', 'other'
            )
        `);

        await queryRunner.query(`
            CREATE TYPE document_status_enum AS ENUM (
                'uploaded', 'pending_review', 'approved', 'rejected', 'expired'
            )
        `);

        // Create work_areas table
        await queryRunner.query(`
            CREATE TABLE "work_areas" (
                "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
                "name" varchar(150) NOT NULL,
                "description" text,
                "type" work_area_type_enum NOT NULL DEFAULT 'village',
                "status" work_area_status_enum NOT NULL DEFAULT 'active',
                "area_code" varchar(20),
                "parent_id" uuid,
                "coordinator_id" uuid,
                "center_point" jsonb,
                "boundary" jsonb,
                "area_km2" decimal(10,4),
                "population" integer,
                "household_count" integer,
                "target_volunteer_count" integer NOT NULL DEFAULT 0,
                "priority" integer NOT NULL DEFAULT 3,
                "metadata" jsonb DEFAULT '{}',
                "address" text,
                "contact_info" jsonb DEFAULT '{}',
                "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "updated_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "deleted_at" timestamp,
                "version" integer NOT NULL DEFAULT 1,
                CONSTRAINT "FK_work_areas_parent_id" FOREIGN KEY ("parent_id") 
                    REFERENCES "work_areas"("id") ON DELETE CASCADE ON UPDATE CASCADE,
                CONSTRAINT "FK_work_areas_coordinator_id" FOREIGN KEY ("coordinator_id") 
                    REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
            )
        `);

        // Create indexes for work_areas
        await queryRunner.query(`CREATE INDEX "IDX_work_areas_name" ON "work_areas" ("name")`);
        await queryRunner.query(`CREATE INDEX "IDX_work_areas_type_status" ON "work_areas" ("type", "status")`);
        await queryRunner.query(`CREATE INDEX "IDX_work_areas_area_code" ON "work_areas" ("area_code")`);
        await queryRunner.query(`CREATE INDEX "IDX_work_areas_status" ON "work_areas" ("status")`);

        // Create volunteers table
        await queryRunner.query(`
            CREATE TABLE "volunteers" (
                "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
                "user_id" uuid NOT NULL UNIQUE,
                "nik" varchar(16) NOT NULL UNIQUE,
                "birth_date" date NOT NULL,
                "birth_place" varchar(100) NOT NULL,
                "gender" gender_enum NOT NULL,
                "marital_status" marital_status_enum NOT NULL DEFAULT 'single',
                "address" text NOT NULL,
                "rt" varchar(3),
                "rw" varchar(3),
                "village" varchar(100),
                "district" varchar(100),
                "city" varchar(100),
                "province" varchar(100),
                "postal_code" varchar(5),
                "education" varchar(50),
                "occupation" varchar(100),
                "emergency_contact_name" varchar(100),
                "emergency_contact_phone" varchar(20),
                "skills" jsonb DEFAULT '[]',
                "bio" text,
                "join_date" date NOT NULL DEFAULT CURRENT_DATE,
                "status" volunteer_status_enum NOT NULL DEFAULT 'active',
                "work_area_id" uuid,
                "profile_photo_url" varchar(500),
                "document_completion_percentage" decimal(5,2) NOT NULL DEFAULT 0.00,
                "last_activity_at" timestamp,
                "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "updated_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "deleted_at" timestamp,
                "version" integer NOT NULL DEFAULT 1,
                CONSTRAINT "FK_volunteers_user_id" FOREIGN KEY ("user_id") 
                    REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
                CONSTRAINT "FK_volunteers_work_area_id" FOREIGN KEY ("work_area_id") 
                    REFERENCES "work_areas"("id") ON DELETE SET NULL ON UPDATE CASCADE
            )
        `);

        // Create indexes for volunteers
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_volunteers_nik" ON "volunteers" ("nik")`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_volunteers_user_id" ON "volunteers" ("user_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_volunteers_status" ON "volunteers" ("status")`);

        // Create media_assets table
        await queryRunner.query(`
            CREATE TABLE "media_assets" (
                "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
                "owner_id" uuid NOT NULL,
                "original_filename" varchar(255) NOT NULL,
                "s3_key" varchar(500) NOT NULL,
                "s3_bucket" varchar(100) NOT NULL,
                "mime_type" varchar(100) NOT NULL,
                "file_size" bigint NOT NULL,
                "checksum" varchar(64) NOT NULL,
                "media_type" media_type_enum NOT NULL,
                "status" media_status_enum NOT NULL DEFAULT 'uploaded',
                "public_url" varchar(500),
                "thumbnail_url" varchar(500),
                "metadata" jsonb,
                "alt_text" varchar(255),
                "is_public" boolean NOT NULL DEFAULT false,
                "download_count" integer NOT NULL DEFAULT 0,
                "expires_at" timestamp,
                "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "updated_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "deleted_at" timestamp,
                "version" integer NOT NULL DEFAULT 1,
                CONSTRAINT "FK_media_assets_owner_id" FOREIGN KEY ("owner_id") 
                    REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
            )
        `);

        // Create indexes for media_assets
        await queryRunner.query(`CREATE INDEX "IDX_media_assets_owner_id" ON "media_assets" ("owner_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_media_assets_mime_type" ON "media_assets" ("mime_type")`);
        await queryRunner.query(`CREATE INDEX "IDX_media_assets_status" ON "media_assets" ("status")`);
        await queryRunner.query(`CREATE INDEX "IDX_media_assets_s3_key" ON "media_assets" ("s3_key")`);
        await queryRunner.query(`CREATE INDEX "IDX_media_assets_checksum" ON "media_assets" ("checksum")`);

        // Create family_members table
        await queryRunner.query(`
            CREATE TABLE "family_members" (
                "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
                "volunteer_id" uuid NOT NULL,
                "name" varchar(100) NOT NULL,
                "nik" varchar(16),
                "relationship" relationship_type_enum NOT NULL,
                "gender" gender_enum NOT NULL,
                "birth_date" date,
                "birth_place" varchar(100),
                "phone" varchar(20),
                "email" varchar(100),
                "occupation" varchar(100),
                "education" varchar(50),
                "address" text,
                "status" family_member_status_enum NOT NULL DEFAULT 'active',
                "is_dependent" boolean NOT NULL DEFAULT false,
                "is_emergency_contact" boolean NOT NULL DEFAULT false,
                "notes" text,
                "display_order" integer NOT NULL DEFAULT 0,
                "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "updated_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "deleted_at" timestamp,
                "version" integer NOT NULL DEFAULT 1,
                CONSTRAINT "FK_family_members_volunteer_id" FOREIGN KEY ("volunteer_id") 
                    REFERENCES "volunteers"("id") ON DELETE CASCADE ON UPDATE CASCADE
            )
        `);

        // Create indexes for family_members
        await queryRunner.query(`CREATE INDEX "IDX_family_members_volunteer_id" ON "family_members" ("volunteer_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_family_members_relationship" ON "family_members" ("relationship")`);
        await queryRunner.query(`CREATE INDEX "IDX_family_members_nik" ON "family_members" ("nik")`);

        // Create documents table
        await queryRunner.query(`
            CREATE TABLE "documents" (
                "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
                "volunteer_id" uuid NOT NULL,
                "asset_id" uuid NOT NULL,
                "document_type" document_type_enum NOT NULL,
                "title" varchar(200) NOT NULL,
                "description" text,
                "status" document_status_enum NOT NULL DEFAULT 'uploaded',
                "document_number" varchar(50),
                "issue_date" date,
                "expiry_date" date,
                "issuing_authority" varchar(150),
                "reviewed_by" uuid,
                "reviewed_at" timestamp,
                "review_notes" text,
                "is_required" boolean NOT NULL DEFAULT false,
                "display_order" integer NOT NULL DEFAULT 0,
                "extracted_data" jsonb,
                "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "updated_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "deleted_at" timestamp,
                "version" integer NOT NULL DEFAULT 1,
                CONSTRAINT "FK_documents_volunteer_id" FOREIGN KEY ("volunteer_id") 
                    REFERENCES "volunteers"("id") ON DELETE CASCADE ON UPDATE CASCADE,
                CONSTRAINT "FK_documents_asset_id" FOREIGN KEY ("asset_id") 
                    REFERENCES "media_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE,
                CONSTRAINT "FK_documents_reviewed_by" FOREIGN KEY ("reviewed_by") 
                    REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
            )
        `);

        // Create indexes for documents
        await queryRunner.query(`CREATE INDEX "IDX_documents_volunteer_id" ON "documents" ("volunteer_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_documents_document_type" ON "documents" ("document_type")`);
        await queryRunner.query(`CREATE INDEX "IDX_documents_status" ON "documents" ("status")`);

        // Create triggers for updated_at
        await queryRunner.query(`
            CREATE TRIGGER update_work_areas_updated_at 
            BEFORE UPDATE ON "work_areas" 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
        `);

        await queryRunner.query(`
            CREATE TRIGGER update_volunteers_updated_at 
            BEFORE UPDATE ON "volunteers" 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
        `);

        await queryRunner.query(`
            CREATE TRIGGER update_media_assets_updated_at 
            BEFORE UPDATE ON "media_assets" 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
        `);

        await queryRunner.query(`
            CREATE TRIGGER update_family_members_updated_at 
            BEFORE UPDATE ON "family_members" 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
        `);

        await queryRunner.query(`
            CREATE TRIGGER update_documents_updated_at 
            BEFORE UPDATE ON "documents" 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop triggers
        await queryRunner.query(`DROP TRIGGER IF EXISTS update_documents_updated_at ON "documents"`);
        await queryRunner.query(`DROP TRIGGER IF EXISTS update_family_members_updated_at ON "family_members"`);
        await queryRunner.query(`DROP TRIGGER IF EXISTS update_media_assets_updated_at ON "media_assets"`);
        await queryRunner.query(`DROP TRIGGER IF EXISTS update_volunteers_updated_at ON "volunteers"`);
        await queryRunner.query(`DROP TRIGGER IF EXISTS update_work_areas_updated_at ON "work_areas"`);

        // Drop indexes
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_documents_status"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_documents_document_type"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_documents_volunteer_id"`);

        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_family_members_nik"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_family_members_relationship"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_family_members_volunteer_id"`);

        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_media_assets_checksum"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_media_assets_s3_key"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_media_assets_status"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_media_assets_mime_type"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_media_assets_owner_id"`);

        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_volunteers_status"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_volunteers_user_id"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_volunteers_nik"`);

        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_work_areas_status"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_work_areas_area_code"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_work_areas_type_status"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_work_areas_name"`);

        // Drop tables (order matters due to foreign keys)
        await queryRunner.query(`DROP TABLE IF EXISTS "documents"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "family_members"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "media_assets"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "volunteers"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "work_areas"`);

        // Drop custom types
        await queryRunner.query(`DROP TYPE IF EXISTS document_status_enum`);
        await queryRunner.query(`DROP TYPE IF EXISTS document_type_enum`);
        await queryRunner.query(`DROP TYPE IF EXISTS media_status_enum`);
        await queryRunner.query(`DROP TYPE IF EXISTS media_type_enum`);
        await queryRunner.query(`DROP TYPE IF EXISTS family_member_status_enum`);
        await queryRunner.query(`DROP TYPE IF EXISTS relationship_type_enum`);
        await queryRunner.query(`DROP TYPE IF EXISTS work_area_status_enum`);
        await queryRunner.query(`DROP TYPE IF EXISTS work_area_type_enum`);
        await queryRunner.query(`DROP TYPE IF EXISTS marital_status_enum`);
        await queryRunner.query(`DROP TYPE IF EXISTS gender_enum`);
        await queryRunner.query(`DROP TYPE IF EXISTS volunteer_status_enum`);
    }
}