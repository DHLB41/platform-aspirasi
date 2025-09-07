import { MigrationInterface, QueryRunner } from 'typeorm';

export class SimplifiedUsersAndTokens1709123456790 implements MigrationInterface {
  name = 'SimplifiedUsersAndTokens1709123456790';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create users table
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "email" character varying NOT NULL,
        "password_hash" character varying,
        "name" character varying NOT NULL,
        "phone" character varying,
        "roles" text NOT NULL DEFAULT 'volunteer',
        "status" character varying NOT NULL DEFAULT 'active',
        "email_verified_at" TIMESTAMP,
        "phone_verified_at" TIMESTAMP,
        "last_login_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "PK_users" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_users_email" UNIQUE ("email")
      )
    `);

    // Create refresh_tokens table
    await queryRunner.query(`
      CREATE TABLE "refresh_tokens" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "token_hash" character varying NOT NULL,
        "expires_at" TIMESTAMP NOT NULL,
        "revoked_at" TIMESTAMP,
        "user_agent" text,
        "ip_address" inet,
        "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "PK_refresh_tokens" PRIMARY KEY ("id"),
        CONSTRAINT "FK_refresh_tokens_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    // Create indexes
    await queryRunner.query(`CREATE INDEX "IDX_users_email" ON "users" ("email")`);
    await queryRunner.query(`CREATE INDEX "IDX_users_phone" ON "users" ("phone")`);
    await queryRunner.query(`CREATE INDEX "IDX_users_status" ON "users" ("status")`);
    await queryRunner.query(`CREATE INDEX "IDX_refresh_tokens_token_hash" ON "refresh_tokens" ("token_hash")`);
    await queryRunner.query(`CREATE INDEX "IDX_refresh_tokens_expires_at" ON "refresh_tokens" ("expires_at")`);
    await queryRunner.query(`CREATE INDEX "IDX_refresh_tokens_user_id" ON "refresh_tokens" ("user_id")`);

    console.log('Tables and indexes created successfully');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_refresh_tokens_user_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_refresh_tokens_expires_at"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_refresh_tokens_token_hash"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_phone"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_email"`);

    // Drop tables
    await queryRunner.query(`DROP TABLE IF EXISTS "refresh_tokens"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
  }
}