#!/bin/bash

set -e

echo "🔧 Setting up Authentication Module"
echo "=================================="

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

# Navigate to API directory
cd apps/api

print_status "Installing dependencies..."
npm install

print_status "Checking Docker services..."
if ! docker ps | grep -q "platform-postgres"; then
    print_warning "PostgreSQL container not running. Starting Docker services..."
    cd ../..
    npm run docker:dev
    sleep 10
    cd apps/api
fi

print_status "Creating migration for users and refresh tokens..."
npm run migration:generate -- src/database/migrations/CreateAuthTables

print_status "Running database migrations..."
npm run migration:run

print_status "Running database seeds..."
npm run seed

print_success "✨ Authentication module setup completed successfully!"
print_success "📧 Default admin credentials: admin@platform.local / admin123!@#"
print_success "📧 Default volunteer credentials: volunteer@platform.local / volunteer123!@#"

echo ""
print_status "Starting the API server..."
npm run start:dev