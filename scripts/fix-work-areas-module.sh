#!/bin/bash

set -e

echo "🔧 Fixing Work Areas Module Registration"
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

cd apps/api

print_status "Step 1: Updating Work Areas Module to include Controller and Service..."

# Update work-areas.module.ts
cat > src/modules/work-areas/work-areas.module.ts << 'EOF'
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkAreasService } from './work-areas.service';
import { WorkAreasController } from './work-areas.controller';
import { WorkArea } from './entities/work-area.entity';
import { User } from '../../auth/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([WorkArea, User])],
  controllers: [WorkAreasController],
  providers: [WorkAreasService],
  exports: [WorkAreasService],
})
export class WorkAreasModule {}
EOF

print_success "Work Areas Module updated!"

print_status "Step 2: Checking if all files exist..."

# Check if all required files exist
if [ ! -f "src/modules/work-areas/work-areas.controller.ts" ]; then
    print_error "work-areas.controller.ts missing!"
    exit 1
fi

if [ ! -f "src/modules/work-areas/work-areas.service.ts" ]; then
    print_error "work-areas.service.ts missing!"
    exit 1
fi

if [ ! -f "src/modules/work-areas/entities/work-area.entity.ts" ]; then
    print_error "work-area.entity.ts missing!"
    exit 1
fi

# Check DTOs
if [ ! -f "src/modules/work-areas/dto/create-work-area.dto.ts" ]; then
    print_error "create-work-area.dto.ts missing!"
    exit 1
fi

print_success "All required files exist!"

print_status "Step 3: Checking and creating missing Guards/Decorators..."

# Check if roles guard exists
if [ ! -f "src/auth/guards/roles.guard.ts" ]; then
    print_status "Creating roles.guard.ts..."
    cat > src/auth/guards/roles.guard.ts << 'EOF'
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../entities/user.entity';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    
    if (!user) {
      return false;
    }

    return requiredRoles.some((role) => user.roles?.includes(role));
  }
}
EOF
fi

# Check if roles decorator exists
if [ ! -f "src/auth/decorators/roles.decorator.ts" ]; then
    print_status "Creating roles.decorator.ts..."
    cat > src/auth/decorators/roles.decorator.ts << 'EOF'
import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../entities/user.entity';

export const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles);
EOF
fi

print_success "Guards and decorators created!"

print_status "Step 4: Building application..."
npm run build

if [ $? -eq 0 ]; then
    print_success "✅ Build successful!"
    
    print_status "Step 5: Checking routes registration..."
    echo ""
    print_success "🎉 Work Areas Module fixed!"
    echo ""
    echo "📋 Expected Work Areas endpoints:"
    echo "  📧 GET    /api/v1/work-areas"
    echo "  📧 POST   /api/v1/work-areas"
    echo "  📧 GET    /api/v1/work-areas/:id"
    echo "  📧 PATCH  /api/v1/work-areas/:id"
    echo "  📧 DELETE /api/v1/work-areas/:id"
    echo "  📧 GET    /api/v1/work-areas/hierarchy"
    echo "  📧 GET    /api/v1/work-areas/search"
    echo "  📧 GET    /api/v1/work-areas/:id/children"
    echo ""
    print_status "Please restart the API server: npm run start:dev"
    echo ""
    print_status "Then test with:"
    echo 'TOKEN=$(curl -s -X POST http://localhost:3001/api/v1/auth/login \'
    echo '  -H "Content-Type: application/json" \'
    echo '  -d '"'"'{"email":"admin@platform.local","password":"admin123!@#"}'"'"' \'
    echo '  | grep -o '"'"'"accessToken":"[^"]*"'"'"' | cut -d'"'"''"'"' -f4)'
    echo ""
    echo 'curl -X POST http://localhost:3001/api/v1/work-areas \'
    echo '  -H "Authorization: Bearer $TOKEN" \'
    echo '  -H "Content-Type: application/json" \'
    echo '  -d '"'"'{"name":"Test Area","type":"village"}'"'"''
    
else
    print_error "❌ Build failed. Checking errors..."
    npm run build
    exit 1
fi