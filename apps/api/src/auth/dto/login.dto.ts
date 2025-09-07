import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString } from "class-validator";

export class LoginDto {
    @ApiProperty({
        description: 'Email address',
        example: 'admin@platform.local'
    })
    @IsEmail({}, { message: 'Invalid email address' })
    email: string;

    @ApiProperty({
        description: 'Password',
        example: 'admin123!'
    })
    @IsString()
    password: string;
}

export class RefreshTokenDto {
    @ApiProperty({
        description: 'Refresh token',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
    })
    @IsString()
    refreshToken: string;
}