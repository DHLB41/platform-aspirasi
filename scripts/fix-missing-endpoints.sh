#!/bin/bash

set -e

echo "🔧 Fixing Missing Profile Endpoint"
echo "================================="

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

print_status "Current auth controller analysis..."

# Check current routes
echo "Current auth controller routes:"
grep -n "^\s*@Get\|^\s*@Post" src/auth/auth.controller.ts | head -10

print_status "Creating missing decorators..."

# Create GetUser decorator if missing
mkdir -p src/auth/decorators
cat > src/auth/decorators/get-user.decorator.ts << 'EOF'
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '../entities/user.entity';

export const GetUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext): User => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    return data ? user?.[data] : user;
  },
);
EOF

print_status "Updating auth controller with both /me and /profile endpoints..."

# Update auth controller with comprehensive endpoints
cat > src/auth/auth.controller.ts << 'EOF'
import {
    Controller,
    Post,
    Body,
    UseGuards,
    Get,
    Req,
    HttpCode,
    HttpStatus,
    Ip,
    Headers,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Throttle } from '@nestjs/throttler';

import { AuthResponse, AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto, RefreshTokenDto } from './dto/login.dto';
import { AuthResponseDto, AuthTokenDto, ResponseDto } from './dto/auth-response.dto';
import { Public } from './decorators/public.decorator';
import { GetUser } from './decorators/get-user.decorator';
import { User } from './entities/user.entity';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('register')
    @Public()
    @Throttle({ default: { limit: 5, ttl: 60000 } })
    @ApiOperation({ summary: 'Register new user account' })
    @ApiResponse({ status: 201, description: 'User registered successfully', type: ResponseDto })
    @ApiResponse({ status: 409, description: 'Email or phone already exists' })
    @ApiResponse({ status: 400, description: 'Validation error' })
    async register(
        @Body() registerDto: RegisterDto,
        @Ip() ipAddress: string,
        @Headers('user-agent') userAgent: string
    ): Promise<ResponseDto<AuthResponse>> {
        const result = await this.authService.register(registerDto, ipAddress, userAgent);
        return ResponseDto.success('User registered successfully', result);
    }

    @Post('login')
    @Public()
    @HttpCode(HttpStatus.OK)
    @Throttle({ default: { limit: 10, ttl: 60000 } })
    @ApiOperation({ summary: 'Login with email and password' })
    @ApiResponse({ status: 200, description: 'Login successful', type: ResponseDto })
    @ApiResponse({ status: 401, description: 'Invalid credentials' })
    async login(
        @Body() loginDto: LoginDto,
        @Ip() ipAddress: string,
        @Headers('user-agent') userAgent: string
    ): Promise<ResponseDto<AuthResponse>> {
        const result = await this.authService.login(loginDto, ipAddress, userAgent);
        return ResponseDto.success('Login successful', result);
    }

    @Post('refresh')
    @Public()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Refresh access token' })
    @ApiResponse({ status: 200, description: 'Token refreshed successfully', type: AuthTokenDto })
    @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
    async refresh(
        @Body() refreshTokenDto: RefreshTokenDto,
        @Ip() ipAddress: string,
        @Headers('user-agent') userAgent: string
    ): Promise<ResponseDto<AuthTokenDto>> {
        const result = await this.authService.refreshToken(
            refreshTokenDto.refreshToken,
            ipAddress,
            userAgent
        );
        return ResponseDto.success('Token refreshed successfully', result);
    }

    @Post('logout')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Logout and revoke refresh token' })
    @ApiResponse({ status: 200, description: 'Logout successful' })
    async logout(@Body() refreshTokenDto: RefreshTokenDto): Promise<ResponseDto> {
        await this.authService.logout(refreshTokenDto.refreshToken);
        return ResponseDto.success('Logout successful');
    }

    @Post('logout-all')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Logout from all devices' })
    @ApiResponse({ status: 200, description: 'Logout from all devices successful' })
    async logoutAll(@GetUser() user: User): Promise<ResponseDto> {
        await this.authService.logoutAll(user.id);
        return ResponseDto.success('Logout from all devices successful');
    }

    @Get('me')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get current user profile' })
    @ApiResponse({ status: 200, description: 'User profile retrieved successfully' })
    async getProfile(@GetUser() user: User): Promise<ResponseDto> {
        // Remove sensitive data
        const { passwordHash, refreshTokens, ...userProfile } = user;
        return ResponseDto.success('User profile retrieved successfully', userProfile);
    }

    @Get('profile')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get current user profile (alias for /me)' })
    @ApiResponse({ status: 200, description: 'User profile retrieved successfully' })
    async getProfileAlias(@GetUser() user: User): Promise<ResponseDto> {
        // Same as /me endpoint for compatibility
        const { passwordHash, refreshTokens, ...userProfile } = user;
        return ResponseDto.success('User profile retrieved successfully', userProfile);
    }

    @Get('status')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get authentication status' })
    @ApiResponse({ status: 200, description: 'Authentication status' })
    async getStatus(@GetUser() user: User): Promise<ResponseDto> {
        return ResponseDto.success('Authentication status', {
            authenticated: true,
            userId: user.id,
            email: user.email,
            roles: user.roles,
            status: user.status,
        });
    }
}
EOF

print_status "Ensuring JWT strategy and guards are properly configured..."

# Check if JWT strategy exists
if [ ! -f "src/auth/strategies/jwt.strategy.ts" ]; then
    print_status "Creating JWT strategy..."
    mkdir -p src/auth/strategies
    cat > src/auth/strategies/jwt.strategy.ts << 'EOF'
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    const user = await this.authService.validateUser(payload.sub);
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
EOF
fi

# Check if JWT guard exists
if [ ! -f "src/auth/guards/jwt-auth.guard.ts" ]; then
    print_status "Creating JWT auth guard..."
    mkdir -p src/auth/guards
    cat > src/auth/guards/jwt-auth.guard.ts << 'EOF'
import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (isPublic) {
      return true;
    }
    
    return super.canActivate(context);
  }
}
EOF
fi

# Check if Public decorator exists
if [ ! -f "src/auth/decorators/public.decorator.ts" ]; then
    print_status "Creating Public decorator..."
    cat > src/auth/decorators/public.decorator.ts << 'EOF'
import { SetMetadata } from '@nestjs/common';

export const Public = () => SetMetadata('isPublic', true);
EOF
fi

print_status "Adding validateUser method to AuthService if missing..."

# Check if validateUser method exists in AuthService
if ! grep -q "validateUser" src/auth/auth.service.ts; then
    print_status "Adding validateUser method to AuthService..."
    
    # Backup current service
    cp src/auth/auth.service.ts src/auth/auth.service.ts.backup
    
    # Add validateUser method
    sed -i.bak '/export class AuthService/a\
\
    async validateUser(userId: string): Promise<User | null> {\
        return this.userRepository.findOne({\
            where: { id: userId, status: UserStatus.ACTIVE },\
        });\
    }' src/auth/auth.service.ts
fi

print_status "Building application..."
npm run build

if [ $? -eq 0 ]; then
    print_success "✅ Build successful!"
    
    print_success "🎉 Profile endpoints added successfully!"
    echo ""
    echo "📋 Available profile endpoints:"
    echo "  📧 GET /api/v1/auth/me"
    echo "  📧 GET /api/v1/auth/profile"
    echo "  📧 GET /api/v1/auth/status"
    echo ""
    echo "🧪 Test commands:"
    echo ""
    echo "# First, login to get token:"
    echo "curl -X POST http://localhost:3001/api/v1/auth/login \\"
    echo "  -H 'Content-Type: application/json' \\"
    echo "  -d '{\"email\":\"admin@platform.local\",\"password\":\"admin123!@#\"}'"
    echo ""
    echo "# Then use the token (replace YOUR_TOKEN):"
    echo "curl -H 'Authorization: Bearer YOUR_TOKEN' \\"
    echo "  http://localhost:3001/api/v1/auth/me"
    echo ""
    echo "curl -H 'Authorization: Bearer YOUR_TOKEN' \\"
    echo "  http://localhost:3001/api/v1/auth/profile"
    echo ""
    print_status "Please restart the API server: npm run start:dev"
    
else
    print_error "❌ Build failed. Please check the errors above."
    exit 1
fi