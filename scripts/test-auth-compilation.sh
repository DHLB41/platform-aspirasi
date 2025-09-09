#!/bin/bash

set -e

echo "🧪 Testing Authentication Module Compilation"
echo "============================================"

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

print_status "Navigating to API directory..."
cd apps/api

print_status "Creating auth types directory..."
mkdir -p src/auth/types

print_status "Installing dependencies..."
npm install

print_status "Checking TypeScript configuration..."
if [ ! -f "tsconfig.json" ]; then
    print_warning "tsconfig.json not found, creating default..."
    cat > tsconfig.json << 'EOF'
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "module": "commonjs",
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "ES2021",
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "incremental": true,
    "skipLibCheck": true,
    "strictNullChecks": false,
    "noImplicitAny": false,
    "strictBindCallApply": false,
    "forceConsistentCasingInFileNames": false,
    "noFallthroughCasesInSwitch": false,
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
EOF
fi

print_status "Testing TypeScript compilation..."
npx tsc --noEmit

if [ $? -eq 0 ]; then
    print_success "✅ TypeScript compilation successful!"
    
    print_status "Testing NestJS build..."
    npm run build
    
    if [ $? -eq 0 ]; then
        print_success "✅ NestJS build successful!"
        print_success "🎉 Authentication module is ready to use!"
        
        echo ""
        print_status "Next steps:"
        echo "  1. Start Docker services: npm run docker:dev"
        echo "  2. Run migrations: npm run migration:run"
        echo "  3. Run seeds: npm run seed"
        echo "  4. Start dev server: npm run start:dev"
        echo ""
        print_status "API Endpoints:"
        echo "  📚 Swagger: http://localhost:3001/api/docs"
        echo "  🔐 Login: POST http://localhost:3001/api/v1/auth/login"
        echo "  👤 Register: POST http://localhost:3001/api/v1/auth/register"
        echo "  🔄 Refresh: POST http://localhost:3001/api/v1/auth/refresh"
        echo "  ❤️ Health: GET http://localhost:3001/api/v1/health"
        
    else
        print_error "❌ NestJS build failed"
        exit 1
    fi
else
    print_error "❌ TypeScript compilation failed"
    exit 1
fi