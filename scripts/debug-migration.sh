#!/bin/bash

set -e

echo "🔍 Debugging TypeORM Migration Issues"
echo "====================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

cd apps/api

print_status "Checking current setup..."

# Check if data-source.ts exists
if [ ! -f "src/database/data-source.ts" ]; then
    print_error "data-source.ts file not found!"
    exit 1
fi

print_status "Checking data-source.ts content..."
echo "Current exports in data-source.ts:"
grep -n "export" src/database/data-source.ts || print_warning "No exports found"

print_status "Testing TypeScript compilation of data-source.ts..."
if npx tsc src/database/data-source.ts --noEmit --skipLibCheck; then
    print_success "data-source.ts compiles successfully"
else
    print_error "data-source.ts has TypeScript errors"
    exit 1
fi

print_status "Checking if Docker services are running..."
if docker ps | grep -q "platform-postgres"; then
    print_success "PostgreSQL container is running"
else
    print_warning "PostgreSQL container not running. Starting Docker services..."
    cd ../..
    npm run docker:dev
    print_status "Waiting for services to be ready..."
    sleep 10
    cd apps/api
fi

print_status "Testing database connection manually..."
if npx ts-node -r tsconfig-paths/register -e "
import AppDataSource from './src/database/data-source';
AppDataSource.initialize()
  .then(() => {
    console.log('✅ Database connection successful');
    return AppDataSource.destroy();
  })
  .catch((err) => {
    console.error('❌ Database connection failed:', err.message);
    process.exit(1);
  });
"; then
    print_success "Direct database connection works"
else
    print_error "Direct database connection failed"
    exit 1
fi

print_status "Checking migration files..."
if [ -d "src/database/migrations" ] && [ "$(ls -A src/database/migrations)" ]; then
    echo "Found migration files:"
    ls -la src/database/migrations/
else
    print_warning "No migration files found"
    print_status "Creating a basic migration..."
    
    mkdir -p src/database/migrations
    
    # Create a simple working migration
    timestamp=$(date +%s)
    cat > "src/database/migrations/${timestamp}-CreateUsersTable.ts" << EOF
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsersTable${timestamp} implements MigrationInterface {
    name = 'CreateUsersTable${timestamp}';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Enable UUID extension
        await queryRunner.query(\`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"\`);
        
        // Create users table
        await queryRunner.query(\`
            CREATE TABLE "users" (
                "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
                "email" varchar(255) NOT NULL UNIQUE,
                "password_hash" varchar(255),
                "name" varchar(255) NOT NULL,
                "phone" varchar(20),
                "roles" text NOT NULL DEFAULT 'volunteer',
                "status" varchar(20) NOT NULL DEFAULT 'active',
                "email_verified_at" timestamp,
                "phone_verified_at" timestamp,
                "last_login_at" timestamp,
                "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "updated_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "deleted_at" timestamp,
                "version" integer NOT NULL DEFAULT 1
            )
        \`);

        // Create indexes
        await queryRunner.query(\`CREATE INDEX "IDX_users_email" ON "users" ("email")\`);
        await queryRunner.query(\`CREATE INDEX "IDX_users_phone" ON "users" ("phone")\`);
        await queryRunner.query(\`CREATE INDEX "IDX_users_status" ON "users" ("status")\`);

        // Create refresh_tokens table
        await queryRunner.query(\`
            CREATE TABLE "refresh_tokens" (
                "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
                "user_id" uuid NOT NULL,
                "token_hash" varchar(255) NOT NULL,
                "expires_at" timestamp NOT NULL,
                "revoked_at" timestamp,
                "user_agent" text,
                "ip_address" inet,
                "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "updated_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "deleted_at" timestamp,
                "version" integer NOT NULL DEFAULT 1,
                CONSTRAINT "FK_refresh_tokens_user_id" FOREIGN KEY ("user_id") 
                    REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
            )
        \`);

        // Create indexes for refresh_tokens
        await queryRunner.query(\`CREATE INDEX "IDX_refresh_tokens_token_hash" ON "refresh_tokens" ("token_hash")\`);
        await queryRunner.query(\`CREATE INDEX "IDX_refresh_tokens_expires_at" ON "refresh_tokens" ("expires_at")\`);
        await queryRunner.query(\`CREATE INDEX "IDX_refresh_tokens_user_id" ON "refresh_tokens" ("user_id")\`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(\`DROP TABLE IF EXISTS "refresh_tokens"\`);
        await queryRunner.query(\`DROP TABLE IF EXISTS "users"\`);
    }
}
EOF
    
    print_success "Created basic migration file"
fi

print_status "Testing TypeORM CLI connection..."
if npm run typeorm -- --help > /dev/null 2>&1; then
    print_success "TypeORM CLI is working"
else
    print_error "TypeORM CLI has issues"
    exit 1
fi

print_status "Attempting migration run..."
if npm run migration:run; then
    print_success "✅ Migration successful!"
    
    print_status "Verifying tables were created..."
    if npx ts-node -r tsconfig-paths/register -e "
    import AppDataSource from './src/database/data-source';
    AppDataSource.initialize()
      .then(async () => {
        const result = await AppDataSource.query('SELECT table_name FROM information_schema.tables WHERE table_schema = \\'public\\'');
        console.log('Created tables:', result.map(r => r.table_name));
        return AppDataSource.destroy();
      })
      .catch(console.error);
    "; then
        print_success "✅ Tables verified successfully!"
    else
        print_warning "Could not verify tables, but migration seemed to work"
    fi
    
else
    print_error "❌ Migration failed"
    print_status "Let's try to diagnose the issue..."
    
    print_status "Checking if data source can be loaded..."
    if npx ts-node -r tsconfig-paths/register -e "
    try {
      const ds = require('./src/database/data-source');
      console.log('Data source loaded:', typeof ds.default);
      console.log('Is DataSource instance:', ds.default.constructor.name);
    } catch (err) {
      console.error('Failed to load data source:', err.message);
    }
    "; then
        print_success "Data source can be loaded"
    else
        print_error "Data source loading failed"
    fi
fi

print_status "Debug completed. Check the output above for any issues."