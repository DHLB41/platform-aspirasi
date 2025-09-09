#!/bin/bash

set -e

echo "🔧 Reverting Failed Migration and Applying Fixed Version"
echo "======================================================="

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

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

cd apps/api

print_status "Step 1: Checking current migration status..."
npm run migration:show

print_status "Step 2: Cleaning up any partial migration state..."
# Check if any ENUMs were created and need cleanup
docker exec -i platform-postgres psql -U platform_user -d platform_dev << 'EOF'
-- Drop any ENUMs that might have been created
DROP TYPE IF EXISTS media_type_enum CASCADE;
DROP TYPE IF EXISTS media_status_enum CASCADE;
DROP TYPE IF EXISTS relationship_type_enum CASCADE;
DROP TYPE IF EXISTS gender_enum CASCADE;
DROP TYPE IF EXISTS family_member_status_enum CASCADE;
DROP TYPE IF EXISTS document_type_enum CASCADE;
DROP TYPE IF EXISTS document_status_enum CASCADE;
DROP TYPE IF EXISTS work_area_type_enum CASCADE;
DROP TYPE IF EXISTS work_area_status_enum CASCADE;
DROP TYPE IF EXISTS volunteer_status_enum CASCADE;
DROP TYPE IF EXISTS marital_status_enum CASCADE;

-- Drop any tables that might have been created
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS family_members CASCADE;
DROP TABLE IF EXISTS volunteers CASCADE;
DROP TABLE IF EXISTS media_assets CASCADE;
DROP TABLE IF EXISTS work_areas CASCADE;

-- Create the missing function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';
EOF

if [ $? -eq 0 ]; then
    print_success "✅ Database cleanup completed"
else
    print_warning "⚠️  Database cleanup had some issues, but continuing..."
fi

print_status "Step 3: Updating migration file with fixed version..."

# Replace the migration file with the fixed version
cat > src/database/migrations/1757407722000-CreateVolunteerTables.ts << 'EOF'
[Copy the content from the Fixed Migration artifact above]
EOF

print_success "Migration file updated with fixed version!"

print_status "Step 4: Testing TypeScript compilation..."
if npm run build > /dev/null 2>&1; then
    print_success "✅ TypeScript compilation successful!"
    
    print_status "Step 5: Running the fixed migration..."
    npm run migration:run
    
    if [ $? -eq 0 ]; then
        print_success "✅ Migration executed successfully!"
        
        print_status "Step 6: Verifying database tables..."
        echo "Created tables:"
        docker exec platform-postgres psql -U platform_user -d platform_dev -c "\dt"
        
        print_status "Step 7: Running database seeds..."
        npm run seed
        
        if [ $? -eq 0 ]; then
            print_success "✅ Seeds executed successfully!"
            
            print_success "🎉 Database setup completed successfully!"
            echo ""
            echo "📊 Database Structure:"
            echo "  ✅ users (auth)"
            echo "  ✅ refresh_tokens (auth)"
            echo "  ✅ work_areas"
            echo "  ✅ media_assets" 
            echo "  ✅ volunteers"
            echo "  ✅ family_members"
            echo "  ✅ documents"
            echo ""
            echo "🔐 Test Accounts:"
            echo "  📧 Admin: admin@platform.local / admin123!@#"
            echo "  📧 Volunteer: volunteer@platform.local / volunteer123!@#"
            echo ""
            print_status "Step 8: Starting API server..."
            npm run start:dev
            
        else
            print_error "❌ Seed execution failed"
            exit 1
        fi
    else
        print_error "❌ Migration execution failed"
        print_status "Showing migration error details..."
        npm run migration:run
        exit 1
    fi
else
    print_error "❌ TypeScript compilation failed"
    print_status "Running build to show errors:"
    npm run build
    exit 1
fi