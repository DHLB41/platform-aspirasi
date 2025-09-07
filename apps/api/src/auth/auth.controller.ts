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

import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto, RefreshTokenDto } from './dto/login.dto';
import { AuthResponseDto, AuthTokenDto, ResponseDto } from './dto/auth-response.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('register')
    @Throttle({ default: { limit: 5, ttl: 60000 } }) // Limit to 5 requests per minute
    @ApiOperation({ summary: 'Register new user accountr' })
    @ApiResponse({ status: 201, description: 'User registered successfully', type: AuthResponseDto })
    @ApiResponse({ status: 409, description: 'Email or phone already exists' })
    @ApiResponse({ status: 400, description: 'Validation error' })
    async register(
        @Body() registerDto: RegisterDto,
        @Ip() ipAddress: string,
        @Req() req: any
    ): Promise<ResponseDto<AuthResponseDto>> {
        const userAgent = req.get('User-Agent');
        const result = await this.authService.register(registerDto, ipAddress, userAgent);

        return ResponseDto.success('User registered successfully');
    }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    @Throttle({ default: { limit: 10, ttl: 60000 } }) // Limit to 10 requests per minute
    @ApiOperation({ summary: 'Login with email and password' })
    @ApiResponse({ status: 200, description: 'Login successful', type: AuthResponseDto })
    @ApiResponse({ status: 401, description: 'Invalid credentials' })
    async login(
        @Body() loginDto: LoginDto,
        @Ip() ipAddress: string,
        @Req() req: any
    ): Promise<ResponseDto<AuthResponseDto>> {
        const userAgent = req.get('User-Agent');
        const result = await this.authService.login(loginDto, ipAddress, userAgent);

        return ResponseDto.success('Login successful');
    }

    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    @Throttle({ default: { limit: 20, ttl: 60000 } }) // Limit to 20 requests per minute
    @ApiOperation({ summary: 'Refresh access token' })
    @ApiResponse({ status: 200, description: 'Token refreshed successfully', type: AuthTokenDto })
    @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
    async refreshToken(
        @Body() refreshTokenDto: RefreshTokenDto,
        @Ip() ipAddress: string,
        @Req() req: any
    ): Promise<ResponseDto<AuthTokenDto>> {
        const userAgent = req.get('User-Agent');
        const tokens = await this.authService.refreshTokens(
            refreshTokenDto.refreshToken,
            ipAddress,
            userAgent,
        );

        return ResponseDto.success('Token refreshed successfully');
    }

    @Post('logout')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Logout and revoke refresh token' })
    @ApiResponse({ status: 200, description: 'Logout successful' })
    async logout(
        @Req() req: any,
        @Body() body: { refreshToken?: string },
    ): Promise<ResponseDto<null>> {
        const userId = req.user.id;
        await this.authService.logout(userId, body.refreshToken);
        return ResponseDto.success('Logout successful');
    }

    @Get('profile')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get current user profile' })
    @ApiResponse({ status: 200, description: 'User profile retrieved successfully'})
    async getProfile(@Req() req: any): Promise<ResponseDto<any>> {
        const user = await this.authService.validateUserById(req.user.id);
        const sanitizedUser = this.authService['sanitizeUser'](user);
        return ResponseDto.success('User profile retrieved successfully', sanitizedUser);
    }

    @Get('me')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get current user basic info' })
    @ApiResponse({ status: 200, description: 'User info retrieved successfully'})
    async getMe(@Req() req: any): Promise<ResponseDto<any>> {
        return ResponseDto.success(req.user, 'User info retrieved successfully');
    }
}