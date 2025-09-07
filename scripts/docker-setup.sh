#!/bin/bash

set -e

echo "🐳 Setting up Docker development environment..."

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

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

print_success "Docker and Docker Compose detected"

# Create environment file if it doesn't exist
if [ ! -f "infrastructure/docker/.env" ]; then
    cp infrastructure/docker/.env.example infrastructure/docker/.env
    print_success "Created .env file from template"
else
    print_warning ".env file already exists"
fi

# Start Docker services
print_status "Starting Docker services..."
docker-compose -f infrastructure/docker/docker-compose.dev.yml up -d

# Wait for services to be ready
print_status "Waiting for services to be ready..."
sleep 10

# Check PostgreSQL
print_status "Checking PostgreSQL connection..."
until docker exec platform-postgres pg_isready -U platform_user -d platform_dev > /dev/null 2>&1; do
    print_status "Waiting for PostgreSQL..."
    sleep 2
done
print_success "PostgreSQL is ready"

# Check Redis
print_status "Checking Redis connection..."
until docker exec platform-redis redis-cli ping > /dev/null 2>&1; do
    print_status "Waiting for Redis..."
    sleep 2
done
print_success "Redis is ready"

# Setup MinIO buckets
print_status "Setting up MinIO buckets..."
docker exec platform-storage mc alias set minio http://localhost:9000 minioadmin minioadmin123 2>/dev/null || true
docker exec platform-storage mc mb minio/platform-assets 2>/dev/null || print_warning "Bucket platform-assets might already exist"
docker exec platform-storage mc mb minio/platform-docs 2>/dev/null || print_warning "Bucket platform-docs might already exist"  
docker exec platform-storage mc mb minio/platform-kta 2>/dev/null || print_warning "Bucket platform-kta might already exist"
docker exec platform-storage mc policy set public minio/platform-assets 2>/dev/null || true

print_success "✨ Docker environment setup completed successfully!"
echo ""
echo "🔧 Services are now running:"
echo "   • PostgreSQL: localhost:5432 (platform_dev)"
echo "   • Redis: localhost:6379"  
echo "   • MinIO API: http://localhost:9000"
echo "   • MinIO Console: http://localhost:9001 (minioadmin/minioadmin123)"
echo "   • MailHog: http://localhost:8025"
echo "   • pgAdmin: http://localhost:5050 (admin@platform.local/admin123)"
echo ""
echo "📋 To stop services: cd infrastructure/docker && docker-compose -f docker-compose.dev.yml down"