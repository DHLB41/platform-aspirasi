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
        private  userRepository: Repository<User>,
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
        const bcryptRounds = this.configService.get('BCRYPT_ROUNDS') || 12;
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
            user: this.sanitizeUser(savedUser),
        };
    }

    async login(loginData: LoginRequest, ipAddress?: string, userAgent?: string): Promise<AuthResponse> {
        const { email, password } = loginData;

        // Find user with password hash
        const user = await this.userRepository.findOne({
            where: { email },
            select: ['id', 'email', 'passwordHash', 'name', 'phone', 'roles', 'status', 'emailVerifiedAt'],
        });

        if (!user) {
            throw new UnauthorizedException('Invalid email or password');
        }

        // Verify password
        if (!user.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) {
            throw new UnauthorizedException('Invalid email or password');
        }

        // Check if user is active
        if (!user.isActive()) {
            throw new UnauthorizedException('User account is not active');
        }

        // Update last login
        await this.userRepository.update(user.id, {
            lastLoginAt: new Date()
        });

        // Generate tokens
        const tokens = await this.generateTokens(user, ipAddress, userAgent);

        return {
            tokens,
            user: this.sanitizeUser(user),
        };
    }

    async refreshTokens(refreshToken: string, ipAddress?: string, userAgent?: string): Promise<AuthResponse> {
        // Hash the provided refresh token
        const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

        // Find the refresh token
        const tokenRecord = await this.refreshTokenRepository.findOne({
            where: { tokenHash },
            relations: ['user'],
        });

        if (!tokenRecord || !tokenRecord.isValid()) {
            throw new UnauthorizedException('Invalid refresh token');
        }

        // Check if the token is still active
        if (!tokenRecord.user.isActive()) {
            throw new UnauthorizedException('Refresh token is inactive');
        }

        // Revoke the old refresh token
        tokenRecord.revoke();
        await this.refreshTokenRepository.save(tokenRecord);

        // Generate new tokens
        const tokens = await this.generateTokens(tokenRecord.user, ipAddress, userAgent);
        
        return {
            tokens,
            user: this.sanitizeUser(tokenRecord.user),
        };
    }

    async logout(userId: string, refreshToken?: string): Promise<void> {
        if (refreshToken) {
            const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
            const tokenRecord = await this.refreshTokenRepository.findOne({
                where: { userId, tokenHash },
            });

            if (tokenRecord) {
                tokenRecord.revoke();
                await this.refreshTokenRepository.save(tokenRecord);
            }
        } else {
            // Revoke all tokens for the user
            await this.refreshTokenRepository.update(
                { userId, revokedAt: null },
                { revokedAt: new Date() }
            );
        }
    }

    async validateUserById(userId: string): Promise<User | null> {
        return this.userRepository.findOne({
            where: { id: userId },
        });
    }

    async validateUserByEmail(email: string): Promise<User | null> {
        return this.userRepository.findOne({
            where: { email },
        });
    }

    private async generateTokens(user: User, ipAddress?: string, userAgent?: string): Promise<AuthTokens> {
        const payload = {
            sub: user.id,
            email: user.email,
            roles: user.roles,
        };

        // Generate access token
        const accessToken = this.jwtService.sign(payload, {
            expiresIn: this.configService.get('JWT_EXPIRES_IN') || '15m',
        });

        // Generate refresh token
        const refreshTokenValue = crypto.randomBytes(40).toString('hex');
        const refreshTokenHash = crypto.createHash('sha256').update(refreshTokenValue).digest('hex');

        // Save refresh token to database
        const refreshTokenExpiry = new Date();
        refreshTokenExpiry.setTime(refreshTokenExpiry.getTime() + (7 * 24 * 60 * 60 * 1000)); // 7 days

        const refreshTokenEntity = this.refreshTokenRepository.create({
            userId: user.id,
            tokenHash: refreshTokenHash,
            expiresAt: refreshTokenExpiry,
            ipAddress,
            userAgent,
        });

        await this.refreshTokenRepository.save(refreshTokenEntity);

        return {
            accessToken,
            refreshToken: refreshTokenValue,
            tokenType: 'Bearer',
            expiresIn: 15 * 60, // 15 minutes
        };
    }

    private sanitizeUser(user: User): Partial<User> {
        const { passwordHash, ...sanitizedUser } = user;
        return sanitizedUser;
    }

    // Method for JWT strategy validation
    async validateJwtPayload(payload: any): Promise<User | null> {
        const user = await this.validateUserById(payload.sub);

        if (user || user.isActive()) {
            return null;
        }

        return user;
    }
}