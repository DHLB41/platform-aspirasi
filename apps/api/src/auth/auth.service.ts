import {
    Injectable,
    ConflictException,
    UnauthorizedException,
    BadRequestException,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

import { User, UserRole } from './entities/user.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { UserResponse } from '@/types/auth.types';

export interface RegisterRequest {
    email: string;
    password: string;
    passwordConfirmation: string;
    name: string;
    phone?: string;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
    tokenType: string;
    expiresIn: number;
}

export interface AuthResponse {
    tokens: AuthTokens;
    user: Partial<User>;
}

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(RefreshToken)
        private readonly refreshTokenRepository: Repository<RefreshToken>,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
    ) {}

    async register(registerData: RegisterRequest, ipAddress?: string, userAgent?: string): Promise<AuthResponse> {
        const { email, password, passwordConfirmation, name, phone } = registerData;

        // Validate password confirmation
        if (password !== passwordConfirmation) {
            throw new BadRequestException('Password and confirmation do not match');
        }

        // Check if email is already exist
        const existingUser = await this.userRepository.findOne({
            where: [{ email }, ...(phone ? [{ phone }] : [])]
        });

        if (existingUser) {
            if (existingUser.email === email) {
                throw new ConflictException('Email is already registered');
            }
            if (existingUser.phone === phone) {
                throw new ConflictException('Phone number is already registered');
            }
        }

        // Hash password
        const bcryptRounds = parseInt(this.configService.get('BCRYPT_ROUNDS')) || 12;
        const passwordHash = await bcrypt.hash(password, bcryptRounds);

        // Create user
        const user = this.userRepository.create({
            email,
            passwordHash,
            name,
            phone,
            roles: [UserRole.VOLUNTEER],
        });

        const savedUser = await this.userRepository.save(user);

        // Generate tokens
        const tokens = await this.generateTokens(savedUser, ipAddress, userAgent);

        return {
            tokens,
            user: this.sanitizeUser(savedUser) as Partial<User>,
        };
    }

    async login(loginData: LoginRequest, ipAddress?: string, userAgent?: string): Promise<AuthResponse> {
        const { email, password } = loginData;

        // Find user by email
        const user = await this.userRepository.findOne({
            where: { email },
        });

        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // Check if user is active
        if (!user.isActive()) {
            throw new UnauthorizedException('Account is suspended or inactive');
        }

        // Verify password
        if (!user.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // Update last login
        await this.userRepository.update(user.id, { lastLoginAt: new Date() });

        // Generate tokens
        const tokens = await this.generateTokens(user, ipAddress, userAgent);

        return {
            tokens,
            user: this.sanitizeUser(user),
        };
    }

    async refreshToken(refreshTokenValue: string, ipAddress?: string, userAgent?: string): Promise<AuthTokens> {
        const hashedToken = crypto.createHash('sha256').update(refreshTokenValue).digest('hex');
        
        const refreshToken = await this.refreshTokenRepository.findOne({
            where: { tokenHash: hashedToken },
            relations: ['user'],
        });

        if (!refreshToken || !refreshToken.isValid()) {
            throw new UnauthorizedException('Invalid or expired refresh token');
        }

        // Check if user is still active
        if (!refreshToken.user.isActive()) {
            throw new UnauthorizedException('Account is suspended or inactive');
        }

        // Revoke old token
        refreshToken.revoke();
        await this.refreshTokenRepository.save(refreshToken);

        // Generate new tokens
        return this.generateTokens(refreshToken.user, ipAddress, userAgent);
    }

    async logout(refreshTokenValue: string): Promise<void> {
        const hashedToken = crypto.createHash('sha256').update(refreshTokenValue).digest('hex');
        
        const refreshToken = await this.refreshTokenRepository.findOne({
            where: { tokenHash: hashedToken },
        });

        if (refreshToken) {
            refreshToken.revoke();
            await this.refreshTokenRepository.save(refreshToken);
        }
    }

    async logoutAll(userId: string): Promise<void> {
        await this.refreshTokenRepository.update(
            { userId, revokedAt: null },
            { revokedAt: new Date() }
        );
    }

    async validateUser(userId: string): Promise<User | null> {
        const user = await this.userRepository.findOne({
            where: { id: userId },
        });

        if (!user || !user.isActive()) {
            return null;
        }

        return user;
    }

    private async generateTokens(user: User, ipAddress?: string, userAgent?: string): Promise<AuthTokens> {
        const payload = {
            sub: user.id,
            email: user.email,
            roles: user.roles,
        };

        // Generate access token
        const accessToken = this.jwtService.sign(payload);

        // Generate refresh token
        const refreshTokenValue = crypto.randomBytes(32).toString('hex');
        const refreshTokenHash = crypto.createHash('sha256').update(refreshTokenValue).digest('hex');

        // Save refresh token to database
        const refreshToken = this.refreshTokenRepository.create({
            userId: user.id,
            tokenHash: refreshTokenHash,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            userAgent,
            ipAddress,
        });

        await this.refreshTokenRepository.save(refreshToken);

        return {
            accessToken,
            refreshToken: refreshTokenValue,
            tokenType: 'Bearer',
            expiresIn: 15 * 60, // 15 minutes in seconds
        };
    }

    private sanitizeUser(user: User): Partial<User> {
        return {
            id: user.id,
            email: user.email,
            name: user.name,
            phone: user.phone,
            roles: user.roles,
            status: user.status,
            emailVerifiedAt: user.emailVerifiedAt,
            phoneVerifiedAt: user.phoneVerifiedAt,
            lastLoginAt: user.lastLoginAt,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };
    }
}