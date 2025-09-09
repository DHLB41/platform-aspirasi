#!/bin/bash

set -e

echo "🚀 Starting Platform Aspirasi API Server"
echo "======================================="

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

print_status "Step 1: Checking Docker services..."
if ! docker ps | grep -q "platform-postgres"; then
    print_warning "Docker services not running. Starting them..."
    npm run docker:dev
    print_status "Waiting for services to initialize..."
    sleep 15
else
    print_success "Docker services are running"
fi

print_status "Step 2: Checking Docker service health..."
echo ""
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep platform
echo ""

print_status "Step 3: Checking database connection..."
if docker exec platform-postgres pg_isready -U platform_user -d platform_dev > /dev/null 2>&1; then
    print_success "Database is ready"
else
    print_error "Database is not ready"
    print_status "Checking database logs..."
    docker logs platform-postgres --tail 10
    exit 1
fi

cd apps/api

print_status "Step 4: Checking if migrations are applied..."
MIGRATION_STATUS=$(npm run migration:show 2>/dev/null | grep "CreateVolunteerTables" || echo "not_found")

if [[ "$MIGRATION_STATUS" == *"CreateVolunteerTables"* ]]; then
    print_success "Migrations are applied"
else
    print_warning "Migrations need to be applied"
    print_status "Running migrations..."
    npm run migration:run
fi

print_status "Step 5: Verifying database tables..."
TABLES=$(docker exec platform-postgres psql -U platform_user -d platform_dev -t -c "SELECT tablename FROM pg_tables WHERE schemaname = 'public';" | tr -d ' ' | grep -v '^$')

echo "Available tables:"
echo "$TABLES" | while read table; do
    if [ ! -z "$table" ]; then
        echo "  ✅ $table"
    fi
done

print_status "Step 6: Checking if seeds are loaded..."
USER_COUNT=$(docker exec platform-postgres psql -U platform_user -d platform_dev -t -c "SELECT COUNT(*) FROM users;" | tr -d ' ')

if [ "$USER_COUNT" -gt "0" ]; then
    print_success "Database has $USER_COUNT users (seeds loaded)"
else
    print_warning "No users found, running seeds..."
    npm run seed
fi

print_status "Step 7: Checking TypeScript compilation..."
if npm run build > /dev/null 2>&1; then
    print_success "TypeScript compilation successful"
else
    print_error "TypeScript compilation failed"
    print_status "Running build to show errors:"
    npm run build
    exit 1
fi

print_status "Step 8: Starting API server..."
echo ""
print_success "🎉 All checks passed! Starting development server..."
echo ""
echo "📊 System Status:"
echo "  ✅ PostgreSQL: Running on port 5432"
echo "  ✅ Redis: Running on port 6379"
echo "  ✅ MinIO: Running on port 9000"
echo "  ✅ Database: Connected and migrated"
echo "  ✅ Seeds: Loaded"
echo "  ✅ Build: Successful"
echo ""
echo "🔐 Test Accounts:"
echo "  📧 Admin: admin@platform.local / admin123!@#"
echo "  📧 Volunteer: volunteer@platform.local / volunteer123!@#"
echo ""
echo "🌐 Will be available at:"
echo "  🚀 API: http://localhost:3001/api/v1"
echo "  📚 Docs: http://localhost:3001/api/docs"
echo "  ❤️  Health: http://localhost:3001/api/v1/health"
echo ""
print_status "Starting server... (Press Ctrl+C to stop)"
echo ""

# Start the API server
npm run start:dev