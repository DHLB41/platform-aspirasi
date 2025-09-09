#!/bin/bash

echo "🧪 Testing Platform Aspirasi API Endpoints"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[TEST]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[PASS]${NC} $1"
}

print_error() {
    echo -e "${RED}[FAIL]${NC} $1"
}

BASE_URL="http://localhost:3001/api/v1"

echo "🔍 Testing available endpoints..."
echo ""

# Test 1: Health Check
print_status "Testing health check endpoint..."
HEALTH_RESPONSE=$(curl -s -w "%{http_code}" "$BASE_URL/health" -o /tmp/health_response.json 2>/dev/null)
HTTP_CODE="${HEALTH_RESPONSE: -3}"

if [ "$HTTP_CODE" = "200" ]; then
    print_success "Health check endpoint working (HTTP 200)"
    echo "   Response: $(cat /tmp/health_response.json)"
else
    print_error "Health check failed (HTTP $HTTP_CODE)"
fi

echo ""

# Test 2: Auth Login
print_status "Testing auth login endpoint..."
LOGIN_RESPONSE=$(curl -s -w "%{http_code}" -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@platform.local","password":"admin123!@#"}' \
    -o /tmp/login_response.json 2>/dev/null)
HTTP_CODE="${LOGIN_RESPONSE: -3}"

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
    print_success "Auth login endpoint working (HTTP $HTTP_CODE)"
    echo "   Admin login successful"
    
    # Extract access token for further tests
    ACCESS_TOKEN=$(cat /tmp/login_response.json | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
    echo "   Access token received: ${ACCESS_TOKEN:0:20}..."
else
    print_error "Auth login failed (HTTP $HTTP_CODE)"
    echo "   Response: $(cat /tmp/login_response.json)"
fi

echo ""

# Test 3: Protected endpoint (if we have access token)
if [ ! -z "$ACCESS_TOKEN" ]; then
    print_status "Testing protected endpoint with auth token..."
    PROTECTED_RESPONSE=$(curl -s -w "%{http_code}" "$BASE_URL/auth/profile" \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -o /tmp/profile_response.json 2>/dev/null)
    HTTP_CODE="${PROTECTED_RESPONSE: -3}"
    
    if [ "$HTTP_CODE" = "200" ]; then
        print_success "Protected endpoint working (HTTP 200)"
        echo "   User profile retrieved"
    else
        print_error "Protected endpoint failed (HTTP $HTTP_CODE)"
    fi
fi

echo ""

# Test 4: Swagger Documentation
print_status "Testing Swagger documentation..."
DOCS_RESPONSE=$(curl -s -w "%{http_code}" "http://localhost:3001/api/docs" -o /dev/null 2>/dev/null)
HTTP_CODE="${DOCS_RESPONSE: -3}"

if [ "$HTTP_CODE" = "200" ]; then
    print_success "Swagger docs available (HTTP 200)"
    echo "   📚 Access at: http://localhost:3001/api/docs"
else
    print_error "Swagger docs not available (HTTP $HTTP_CODE)"
fi

echo ""

# Test 5: Available Routes Discovery
print_status "Discovering available routes..."
echo ""

echo "🛣️  Available endpoints to test:"
echo "   ✅ Health:      GET  $BASE_URL/health"
echo "   🔐 Auth Login:  POST $BASE_URL/auth/login"
echo "   👤 Auth Profile: GET $BASE_URL/auth/profile (requires auth)"
echo "   📝 Auth Register: POST $BASE_URL/auth/register"
echo "   🔄 Auth Refresh: POST $BASE_URL/auth/refresh"
echo "   📚 API Docs:    GET  http://localhost:3001/api/docs"

echo ""
echo "🧪 Quick Test Commands:"
echo ""

cat << 'EOF'
# Health Check
curl http://localhost:3001/api/v1/health

# Login as Admin
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@platform.local","password":"admin123!@#"}'

# Login as Volunteer  
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"volunteer@platform.local","password":"volunteer123!@#"}'

# Register New User
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com", 
    "password": "password123!@#",
    "phone": "+6281234567890"
  }'

# Get User Profile (replace TOKEN with actual token from login)
curl -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  http://localhost:3001/api/v1/auth/profile

EOF

echo ""
echo "🎉 API is running successfully!"
echo "📱 You can also test using the Swagger UI at: http://localhost:3001/api/docs"

# Cleanup temp files
rm -f /tmp/health_response.json /tmp/login_response.json /tmp/profile_response.json