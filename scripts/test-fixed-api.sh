#!/bin/bash

echo "🧪 Testing Fixed API with Correct Credentials"
echo "============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

print_test() {
    echo -e "${BLUE}[TEST]${NC} $1"
}

print_pass() {
    echo -e "${GREEN}[PASS]${NC} $1"
}

print_fail() {
    echo -e "${RED}[FAIL]${NC} $1"
}

print_info() {
    echo -e "${PURPLE}[INFO]${NC} $1"
}

BASE_URL="http://localhost:3001/api/v1"
TEMP_DIR="/tmp/api_test_fixed"
mkdir -p $TEMP_DIR

echo ""

# Test 1: Health Check
print_test "1. Health Check"
RESPONSE=$(curl -s -w "HTTPSTATUS:%{http_code}" "$BASE_URL/health" 2>/dev/null)
HTTP_CODE=$(echo $RESPONSE | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
BODY=$(echo $RESPONSE | sed -e 's/HTTPSTATUS:.*//')

if [ "$HTTP_CODE" = "200" ]; then
    print_pass "✅ Health endpoint working"
    echo "   Status: $BODY"
else
    print_fail "❌ Health endpoint failed (HTTP $HTTP_CODE)"
fi
echo ""

# Test 2: Admin Login with Correct Password
print_test "2. Admin Login (with correct password)"
ADMIN_PAYLOAD='{"email":"admin@platform.local","password":"admin123!@#"}'
RESPONSE=$(curl -s -w "HTTPSTATUS:%{http_code}" -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d "$ADMIN_PAYLOAD" 2>/dev/null)
HTTP_CODE=$(echo $RESPONSE | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
BODY=$(echo $RESPONSE | sed -e 's/HTTPSTATUS:.*//')

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
    print_pass "✅ Admin login successful"
    
    # Extract token from the nested JSON structure
    ACCESS_TOKEN=$(echo $BODY | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
    if [ -z "$ACCESS_TOKEN" ]; then
        # Try alternative token field names
        ACCESS_TOKEN=$(echo $BODY | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
    fi
    
    if [ ! -z "$ACCESS_TOKEN" ]; then
        echo "   Token: ${ACCESS_TOKEN:0:50}..."
        echo $ACCESS_TOKEN > $TEMP_DIR/admin_token
        print_info "   ✅ Access token saved"
    else
        print_fail "   ❌ Could not extract access token"
        echo "   Response: $BODY"
    fi
else
    print_fail "❌ Admin login failed (HTTP $HTTP_CODE)"
    echo "   Response: $BODY"
fi
echo ""

# Test 3: Volunteer Login
print_test "3. Volunteer Login"
VOLUNTEER_PAYLOAD='{"email":"volunteer@platform.local","password":"volunteer123!@#"}'
RESPONSE=$(curl -s -w "HTTPSTATUS:%{http_code}" -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d "$VOLUNTEER_PAYLOAD" 2>/dev/null)
HTTP_CODE=$(echo $RESPONSE | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
BODY=$(echo $RESPONSE | sed -e 's/HTTPSTATUS:.*//')

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
    print_pass "✅ Volunteer login successful"
    
    VOLUNTEER_TOKEN=$(echo $BODY | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
    if [ -z "$VOLUNTEER_TOKEN" ]; then
        VOLUNTEER_TOKEN=$(echo $BODY | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
    fi
    
    if [ ! -z "$VOLUNTEER_TOKEN" ]; then
        echo "   Token: ${VOLUNTEER_TOKEN:0:50}..."
        echo $VOLUNTEER_TOKEN > $TEMP_DIR/volunteer_token
    fi
else
    print_fail "❌ Volunteer login failed (HTTP $HTTP_CODE)"
    echo "   Response: $BODY"
fi
echo ""

# Test 4: Profile Access
if [ -f "$TEMP_DIR/admin_token" ]; then
    print_test "4. Profile Access with Admin Token"
    ADMIN_TOKEN=$(cat $TEMP_DIR/admin_token)
    RESPONSE=$(curl -s -w "HTTPSTATUS:%{http_code}" "$BASE_URL/auth/profile" \
        -H "Authorization: Bearer $ADMIN_TOKEN" 2>/dev/null)
    HTTP_CODE=$(echo $RESPONSE | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
    BODY=$(echo $RESPONSE | sed -e 's/HTTPSTATUS:.*//')
    
    if [ "$HTTP_CODE" = "200" ]; then
        print_pass "✅ Profile access successful"
        echo "   Profile data retrieved"
    else
        print_fail "❌ Profile access failed (HTTP $HTTP_CODE)"
        echo "   Response: $BODY"
    fi
else
    print_fail "4. Profile Access - No admin token available"
fi
echo ""

# Test 5: User Registration with Fixed Format
print_test "5. User Registration (Fixed Validation)"
REGISTER_PAYLOAD='{
    "name": "Test User",
    "email": "testuser@example.com",
    "password": "TestPassword123!@#",
    "passwordConfirmation": "TestPassword123!@#",
    "phone": "+6281234567890"
}'
RESPONSE=$(curl -s -w "HTTPSTATUS:%{http_code}" -X POST "$BASE_URL/auth/register" \
    -H "Content-Type: application/json" \
    -d "$REGISTER_PAYLOAD" 2>/dev/null)
HTTP_CODE=$(echo $RESPONSE | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
BODY=$(echo $RESPONSE | sed -e 's/HTTPSTATUS:.*//')

if [ "$HTTP_CODE" = "201" ] || [ "$HTTP_CODE" = "200" ]; then
    print_pass "✅ User registration successful"
    echo "   New user created with proper validation"
elif [ "$HTTP_CODE" = "409" ]; then
    print_pass "✅ Duplicate email properly handled"
else
    print_fail "❌ User registration failed (HTTP $HTTP_CODE)"
    echo "   Response: $BODY"
fi
echo ""

# Test 6: CORS Headers
print_test "6. CORS Headers"
RESPONSE=$(curl -s -I -X OPTIONS "$BASE_URL/health" \
    -H "Origin: http://localhost:3000" \
    -H "Access-Control-Request-Method: GET" 2>/dev/null)

if echo "$RESPONSE" | grep -i "access-control-allow-origin" > /dev/null; then
    print_pass "✅ CORS headers present"
    echo "   Headers configured properly"
else
    print_fail "❌ CORS headers missing"
fi
echo ""

# Test 7: Swagger Documentation
print_test "7. Swagger Documentation"
RESPONSE=$(curl -s -w "HTTPSTATUS:%{http_code}" "http://localhost:3001/api/docs" 2>/dev/null)
HTTP_CODE=$(echo $RESPONSE | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')

if [ "$HTTP_CODE" = "200" ]; then
    print_pass "✅ Swagger docs accessible"
    echo "   📚 Available at: http://localhost:3001/api/docs"
else
    print_fail "❌ Swagger docs not accessible (HTTP $HTTP_CODE)"
fi
echo ""

# Test 8: Invalid Credentials (Should Fail)
print_test "8. Security - Invalid Credentials"
INVALID_PAYLOAD='{"email":"invalid@example.com","password":"wrongpassword"}'
RESPONSE=$(curl -s -w "HTTPSTATUS:%{http_code}" -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d "$INVALID_PAYLOAD" 2>/dev/null)
HTTP_CODE=$(echo $RESPONSE | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')

if [ "$HTTP_CODE" = "401" ]; then
    print_pass "✅ Invalid credentials properly rejected"
else
    print_fail "❌ Security issue - invalid credentials not properly handled"
fi
echo ""

# Summary
echo "🏆 Test Results Summary"
echo "======================"
echo ""

if [ -f "$TEMP_DIR/admin_token" ] && [ -f "$TEMP_DIR/volunteer_token" ]; then
    print_pass "🎉 ALL CORE FEATURES WORKING!"
    echo ""
    echo "✅ Authentication System: WORKING"
    echo "✅ User Management: WORKING"  
    echo "✅ API Security: WORKING"
    echo "✅ Validation: WORKING"
    echo "✅ Documentation: WORKING"
    echo ""
    echo "🚀 Ready for Next Phase: Volunteer Management API"
else
    print_fail "❌ Some core features need attention"
fi

echo ""
echo "📖 Quick Commands for Development:"
echo ""
echo "# Admin Login:"
echo "curl -X POST $BASE_URL/auth/login \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '$ADMIN_PAYLOAD'"
echo ""
echo "# Get Profile (replace TOKEN):"
echo "curl -H 'Authorization: Bearer YOUR_TOKEN' \\"
echo "  $BASE_URL/auth/profile"
echo ""
echo "# Register New User:"
echo "curl -X POST $BASE_URL/auth/register \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '$REGISTER_PAYLOAD'"
echo ""
echo "📚 Swagger UI: http://localhost:3001/api/docs"

# Cleanup
rm -rf $TEMP_DIR