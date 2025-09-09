import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, MaxLength, Matches, IsOptional } from 'class-validator';

export class RegisterDto {
    @ApiProperty({ description: 'Email address', example: 'user@example.com' })
    @IsEmail({}, { message: 'Please provide a valid email address' })
    email: string;

    @ApiProperty({ description: 'Password', minLength: 8, example: 'SecurePassword123!' })
    @IsString()
    @MinLength(8, { message: 'Password must be at least 8 characters long' })
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
        message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    })
    password: string;

    @ApiProperty({ description: 'Password confirmation', example: 'SecurePassword123!' })
    @IsString()
    passwordConfirmation: string;

    @ApiProperty({ description: 'Full name', example: 'John Doe' })
    @IsString()
    @MinLength(2, { message: 'Name must be at least 2 characters long' })
    @MaxLength(100, { message: 'Name cannot exceed 100 characters' })
    name: string;

    @ApiProperty({ description: 'Phone number', required: false, example: '+6281234567890' })
    @IsOptional()
    @IsString()
    @Matches(/^\+62[1-9]\d{7,11}$/, { message: 'Please provide a valid Indonesian phone number (+62...)' })
    phone?: string;
}