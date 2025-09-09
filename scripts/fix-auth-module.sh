#!/bin/bash
# scripts/fix-auth-module.sh

set -e

echo "🔧 Fixing Authentication Module Type Errors"
echo "==========================================="

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

print_status "Creating necessary directories..."

# Create directories
mkdir -p apps/api/src/common/entities
mkdir -p apps/api/src/auth/dto
mkdir -p apps/api/src/auth/guards
mkdir -p apps/api/src/auth/decorators
mkdir -p apps/api/src/auth/strategies
mkdir -p apps/api/src/config
mkdir -p apps/api/src/health
mkdir -p apps/api/src/database/migrations
mkdir -p apps/api/src/database/seeds

print_success "Directories created"

print_status "Installing missing dependencies..."
cd apps/api
npm install compression

print_status "Creating .env file..."
if [ ! -f ".env" ]; then
    cp ../../infrastructure/docker/.env.example .env
    print_success ".env file created from template"
else
    print_warning ".env file already exists"
fi

print_status "Type checking..."
npm run build

if [ $? -eq 0 ]; then
    print_success "TypeScript compilation successful!"
    
    print_status "Starting Docker services if not running..."
    cd ../..
    npm run docker:dev
    
    cd apps/api
    print_status "Waiting for database to be ready..."
    sleep 5
    
    print_status "Running migrations..."
    npm run migration:run || print_warning "Migration may have already been run"
    
    print_status "Running seeds..."
    npm run seed || print_warning "Seeds may have already been run"
    
    print_success "✨ Authentication module is now ready!"
    print_success "📧 Admin login: admin@platform.local / admin123!@#"
    print_success "🚀 API will start at: http://localhost:3001/api/v1"
    print_success "📚 Swagger docs: http://localhost:3001/api/docs"
    
    echo ""
    print_status "Starting development server..."
    npm run start:dev
else
    print_error "TypeScript compilation failed. Please check the errors above."
    exit 1
fi