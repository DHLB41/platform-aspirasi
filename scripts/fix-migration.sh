#!/bin/bash

set -e

echo "🔧 Fixing Entity Relations and Running Migration"
echo "==============================================="

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

print_status "Creating backup of current entities..."
mkdir -p backup/entities
cp -r src/modules/volunteers/entities backup/entities/ 2>/dev/null || true
cp -r src/modules/work-areas/entities backup/entities/ 2>/dev/null || true

print_status "Fixing Volunteer entity..."
# Copy the fixed Volunteer entity from artifacts
cat > src/modules/volunteers/entities/volunteer.entity.ts << 'EOF'
[Content from Fix Volunteer Entity artifact above]
EOF

print_status "Fixing WorkArea entity..."
# Copy the fixed WorkArea entity from artifacts  
cat > src/modules/work-areas/entities/work-area.entity.ts << 'EOF'
[Content from Fix WorkArea Entity artifact above]
EOF

print_status "Testing TypeScript compilation..."
if npm run build > /dev/null 2>&1; then
    print_success "✅ TypeScript compilation successful!"
    
    print_status "Starting Docker services if needed..."
    cd ../..
    if ! docker ps | grep -q "platform-postgres"; then
        print_status "Starting Docker containers..."
        npm run docker:dev
        sleep 10
    else
        print_success "Docker services already running"
    fi
    
    cd apps/api
    
    print_status "Running migration..."
    npm run migration:run
    
    if [ $? -eq 0 ]; then
        print_success "✅ Migration executed successfully!"
        
        print_status "Running database seeds..."
        npm run seed
        
        if [ $? -eq 0 ]; then
            print_success "✅ Seeds executed successfully!"
            
            print_success "🎉 Database setup completed successfully!"
            echo ""
            echo "📊 Database tables created:"
            echo "  - users (from auth module)"
            echo "  - refresh_tokens (from auth module)" 
            echo "  - work_areas"
            echo "  - media_assets"
            echo "  - volunteers"
            echo "  - family_members"
            echo "  - documents"
            echo ""
            print_status "Starting API server..."
            echo "🚀 API endpoints: http://localhost:3001/api/v1"
            echo "📚 Swagger docs: http://localhost:3001/api/docs"
            echo "📧 Admin login: admin@platform.local / admin123!@#"
            echo ""
            
            npm run start:dev
        else
            print_error "❌ Seed execution failed"
            exit 1
        fi
    else
        print_error "❌ Migration execution failed"
        print_status "Checking for detailed error..."
        npm run migration:run
        exit 1
    fi
else
    print_error "❌ TypeScript compilation failed"
    print_status "Running build to show errors:"
    npm run build
    exit 1
fi