#!/bin/bash

set -e

echo "🧪 Testing Platform Aspirasi Services"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_test() {
    echo -e "${BLUE}[TEST]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[✅ PASS]${NC} $1"
}

print_fail() {
    echo -e "${RED}[❌ FAIL]${NC} $1"
}

print_skip() {
    echo -e "${YELLOW}[⏭️  SKIP]${NC} $1"
}

# Test 1: Check if containers are running
print_test "Checking Docker containers status..."
echo ""
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" --filter "name=platform-"
echo ""

# Test 2: PostgreSQL
print_test "Testing PostgreSQL connection..."
if docker exec platform-postgres pg_isready -U platform_user -d platform_dev > /dev/null 2>&1; then
    print_success "PostgreSQL is running and accepting connections"
    
    # Test database query
    print_test "Testing PostgreSQL query..."
    if docker exec platform-postgres psql -U platform_user -d platform_dev -c "SELECT 'PostgreSQL Test' as test, NOW() as timestamp;" > /dev/null 2>&1; then
        print_success "PostgreSQL queries working"
    else
        print_fail "PostgreSQL query failed"
    fi
    
    # Test our custom function
    print_test "Testing custom health_check function..."
    if docker exec platform-postgres psql -U platform_user -d platform_dev -c "SELECT health_check();" > /dev/null 2>&1; then
        print_success "Custom PostgreSQL functions working"
    else
        print_fail "Custom PostgreSQL function failed"
    fi
else
    print_fail "PostgreSQL connection failed"
fi

echo ""

# Test 3: Redis
print_test "Testing Redis connection..."
if docker exec platform-redis redis-cli ping > /dev/null 2>&1; then
    print_success "Redis is running and accepting connections"
    
    # Test Redis operations
    print_test "Testing Redis set/get operations..."
    if docker exec platform-redis redis-cli set test-key "test-value" > /dev/null 2>&1 && \
       [ "$(docker exec platform-redis redis-cli get test-key)" = "test-value" ]; then
        print_success "Redis operations working"
        docker exec platform-redis redis-cli del test-key > /dev/null 2>&1
    else
        print_fail "Redis operations failed"
    fi
else
    print_fail "Redis connection failed"
fi

echo ""

# Test 4: MailHog
print_test "Testing MailHog web interface..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:8025 | grep -q "200"; then
    print_success "MailHog web interface accessible at http://localhost:8025"
else
    print_fail "MailHog web interface not accessible"
fi

# Test MailHog SMTP
print_test "Testing MailHog SMTP port..."
if nc -z localhost 1025 2>/dev/null; then
    print_success "MailHog SMTP port (1025) is open"
else
    print_fail "MailHog SMTP port (1025) not accessible"
fi

echo ""

# Test 5: MinIO
print_test "Testing MinIO services..."
if docker ps --format "{{.Names}}" | grep -q "platform-storage"; then
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:9002/minio/health/live | grep -q "200"; then
        print_success "MinIO API accessible at http://localhost:9002"
    else
        print_fail "MinIO API not accessible at http://localhost:9002"
    fi
    
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:9003 | grep -q "200"; then
        print_success "MinIO Console accessible at http://localhost:9003"
    else
        print_fail "MinIO Console not accessible at http://localhost:9003"
    fi
else
    print_skip "MinIO container not running"
fi

echo ""

# Test 6: pgAdmin
print_test "Testing pgAdmin web interface..."
if docker ps --format "{{.Names}}" | grep -q "platform-pgadmin"; then
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:5050 | grep -q "200"; then
        print_success "pgAdmin accessible at http://localhost:5050"
        echo "         Login: admin@platform.local / admin123"
    else
        print_fail "pgAdmin not accessible at http://localhost:5050"
    fi
else
    print_skip "pgAdmin container not running"
fi

echo ""

# Test 7: Network connectivity between services
print_test "Testing inter-service network connectivity..."
if docker exec platform-postgres nc -z platform-redis 6379 2>/dev/null; then
    print_success "Services can communicate via Docker network"
else
    print_fail "Inter-service network communication failed"
fi

echo ""

# Summary
echo "🎯 Service Test Summary"
echo "======================"
echo "✅ Required for development:"
echo "   • PostgreSQL: $(docker exec platform-postgres pg_isready -U platform_user -d platform_dev > /dev/null 2>&1 && echo "✅ Ready" || echo "❌ Failed")"
echo "   • Redis: $(docker exec platform-redis redis-cli ping > /dev/null 2>&1 && echo "✅ Ready" || echo "❌ Failed")"
echo "   • MailHog: $(curl -s -o /dev/null -w "%{http_code}" http://localhost:8025 | grep -q "200" && echo "✅ Ready" || echo "❌ Failed")"
echo ""
echo "⚡ Optional services:"
echo "   • MinIO: $(docker ps --format "{{.Names}}" | grep -q "platform-storage" && echo "✅ Running" || echo "❌ Not Running")"
echo "   • pgAdmin: $(docker ps --format "{{.Names}}" | grep -q "platform-pgadmin" && echo "✅ Running" || echo "❌ Not Running")"
echo ""

# Check if core services are ready
POSTGRES_OK=$(docker exec platform-postgres pg_isready -U platform_user -d platform_dev > /dev/null 2>&1 && echo "1" || echo "0")
REDIS_OK=$(docker exec platform-redis redis-cli ping > /dev/null 2>&1 && echo "1" || echo "0")
MAILHOG_OK=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8025 | grep -q "200" && echo "1" || echo "0")

if [ "$POSTGRES_OK" = "1" ] && [ "$REDIS_OK" = "1" ] && [ "$MAILHOG_OK" = "1" ]; then
    print_success "🚀 Core services ready for development!"
    echo ""
    echo "🔗 Quick Access URLs:"
    echo "   • MailHog (Email testing): http://localhost:8025"
    echo "   • pgAdmin (DB management): http://localhost:5050"
    echo "   • MinIO Console (File storage): http://localhost:9003"
    echo ""
    echo "📝 Database Connection String:"
    echo "   postgresql://platform_user:dev_password_2024@localhost:5432/platform_dev"
    echo ""
    echo "✨ Ready to proceed with backend development!"
else
    print_fail "Some core services are not ready. Please fix before proceeding."
    exit 1
fi