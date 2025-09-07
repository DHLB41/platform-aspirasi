import { ApiProperty } from '@nestjs/swagger';
import { User } from '../entities/user.entity';

export class AuthTokenDto {
    @ApiProperty({
        description: 'JWT access token',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
    })
    accessToken: string;

    @ApiProperty({
        description: 'JWT refresh token',
        example: 'a1b2c3d4e5f6...'
    })
    refreshToken: string;

    @ApiProperty({
        description: 'Token type',
        example: 'Bearer',
        default: 'Bearer'
    })
    tokenType: string = 'Bearer';

    @ApiProperty({
        description: 'Access token expiration time in seconds',
        example: 900
    })
    expiresIn: number;
}

export class AuthResponseDto {
    @ApiProperty({
        description: 'Authentication tokens',
        type: AuthTokenDto
    })
    tokens: AuthTokenDto;

    @ApiProperty({
        description: 'User information',
        type: () => User
    })
    user: Partial<User>;
}

export class ResponseDto<T = any> {
    @ApiProperty()
    success: boolean;

    @ApiProperty()
    message: string;

    @ApiProperty()
    data?: T;

    constructor(success: boolean, message: string, data?: T) {
        this.success = success;
        this.message = message;
        this.data = data;
    }

    static success<T>(message: string, data?: T): ResponseDto<T> {
        return new ResponseDto<T>(true, message, data);
    }

    static error(message: string, data?: any): ResponseDto {
        return new ResponseDto(false, message, data);
    }
}