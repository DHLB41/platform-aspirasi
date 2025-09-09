// apps/api/src/auth/auth.controller.ts
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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Throttle } from '@nestjs/throttler';

import { AuthResponse, AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto, RefreshTokenDto } from './dto/login.dto';
import { AuthResponseDto, AuthTokenDto, ResponseDto } from './dto/auth-response.dto';
import { Public } from './decorators/public.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('register')
    @Public()
    @Throttle({ default: { limit: 5, ttl: 60000 } }) // Limit to 5 requests per minute
    @ApiOperation({ summary: 'Register new user account' })
    @ApiResponse({ status: 201, description: 'User registered successfully', type: ResponseDto })
    @ApiResponse({ status: 409, description: 'Email or phone already exists' })
    @ApiResponse({ status: 400, description: 'Validation error' })
    async register(
        @Body() registerDto: RegisterDto,
        @Ip() ipAddress: string,
        @Req() req: any
    ): Promise<ResponseDto<AuthResponse>> {
        const userAgent = req.get('User-Agent');
        const result = await this.authService.register(registerDto, ipAddress, userAgent);

        return ResponseDto.success('User registered successfully', result);
    }

    @Post('login')
    @Public()
    @HttpCode(HttpStatus.OK)
    @Throttle({ default: { limit: 10, ttl: 60000 } }) // Limit to 10 requests per minute
    @ApiOperation({ summary: 'Login with email and password' })
    @ApiResponse({ status: 200, description: 'Login successful', type: ResponseDto })
    @ApiResponse({ status: 401, description: 'Invalid credentials' })
    async login(
        @Body() loginDto: LoginDto,
        @Ip() ipAddress: string,
        @Req() req: any
    ): Promise<ResponseDto<AuthResponse>> {
        const userAgent = req.get('User-Agent');
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
        @Req() req: any
    ): Promise<ResponseDto<AuthTokenDto>> {
        const userAgent = req.get('User-Agent');
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
    async logoutAll(@Req() req: any): Promise<ResponseDto> {
        await this.authService.logoutAll(req.user.id);
        return ResponseDto.success('Logout from all devices successful');
    }

    @Get('me')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get current user profile' })
    @ApiResponse({ status: 200, description: 'User profile retrieved successfully' })
    async getProfile(@Req() req: any): Promise<ResponseDto> {
        return ResponseDto.success('User profile retrieved successfully', req.user);
    }
}