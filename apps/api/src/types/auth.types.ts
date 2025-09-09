import { UserRole } from '../auth/entities/user.entity';

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

export interface UserResponse {
    id: string;
    email: string;
    name: string;
    phone?: string;
    roles: UserRole[];
    status: string;
    emailVerifiedAt?: Date;
    phoneVerifiedAt?: Date;
    lastLoginAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface AuthResponse {
    tokens: AuthTokens;
    user: UserResponse;
}

export interface JwtPayload {
    sub: string;
    email: string;
    roles: UserRole[];
    iat?: number;
    exp?: number;
}