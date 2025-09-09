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
