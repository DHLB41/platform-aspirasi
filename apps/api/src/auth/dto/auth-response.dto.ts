import { ApiProperty } from '@nestjs/swagger';
import { UserRole, UserStatus } from '../entities/user.entity';

export class AuthTokenDto {
    @ApiProperty({ description: 'Access token' })
    accessToken: string;

    @ApiProperty({ description: 'Refresh token' })
    refreshToken: string;

    @ApiProperty({ description: 'Token type', example: 'Bearer' })
    tokenType: string;

    @ApiProperty({ description: 'Token expiration in seconds', example: 900 })
    expiresIn: number;
}

export class UserDto {
    @ApiProperty({ description: 'User ID' })
    id: string;

    @ApiProperty({ description: 'Email address' })
    email: string;

    @ApiProperty({ description: 'Full name' })
    name: string;

    @ApiProperty({ description: 'Phone number', required: false })
    phone?: string;

    @ApiProperty({ enum: UserRole, isArray: true, description: 'User roles' })
    roles: UserRole[];

    @ApiProperty({ description: 'Account status' })
    status: string;

    @ApiProperty({ description: 'Email verification status', required: false })
    emailVerifiedAt?: Date;

    @ApiProperty({ description: 'Phone verification status', required: false })
    phoneVerifiedAt?: Date;

    @ApiProperty({ description: 'Last login timestamp', required: false })
    lastLoginAt?: Date;

    @ApiProperty({ description: 'Creation timestamp' })
    createdAt: Date;

    @ApiProperty({ description: 'Last update timestamp' })
    updatedAt: Date;
}

export class AuthResponseDto {
    @ApiProperty({ type: AuthTokenDto, description: 'Authentication tokens' })
    tokens: AuthTokenDto;

    @ApiProperty({ type: UserDto, description: 'User information' })
    user: UserDto;
}

export class ResponseDto<T = any> {
    @ApiProperty({ description: 'Success status' })
    success: boolean;

    @ApiProperty({ description: 'Response message' })
    message: string;

    @ApiProperty({ description: 'Response data', required: false })
    data?: T;

    @ApiProperty({ description: 'Error details', required: false })
    error?: any;

    @ApiProperty({ description: 'Timestamp' })
    timestamp: string;

    constructor(success: boolean, message: string, data?: T, error?: any) {
        this.success = success;
        this.message = message;
        this.data = data;
        this.error = error;
        this.timestamp = new Date().toISOString();
    }

    static success<T>(message: string, data?: T): ResponseDto<T> {
        return new ResponseDto(true, message, data);
    }

    static error(message: string, error?: any): ResponseDto {
        return new ResponseDto(false, message, undefined, error);
    }
}