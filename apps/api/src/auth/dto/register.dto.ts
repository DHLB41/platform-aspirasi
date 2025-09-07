import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, MinLength, MaxLength, IsOptional, Matches, Max } from "class-validator";

export class RegisterDto {
    @ApiProperty({
        description: 'Email address',
        example: 'user@example.com'
    })
    @IsEmail({}, { message: 'Invalid email address' })
    email: string;

    @ApiProperty({
        description: 'Password (min 8 characters, must contain uppercase, lowercase, and number/symbol)',
        example: 'Password123!',
        minLength: 8,
    })
    @IsString()
    @MinLength(8, { message: 'Password must be at least 8 characters long' })
    @Matches(/(?=.*[a-z])/, {
        message: 'Password must contain uppercase, lowercase, and number/symbol'
    })
    password: string;

    @ApiProperty({
        description: 'Password confirmation',
        example: 'Password123!',
    })
    @IsString()
    passwordConfirmation: string;

    @ApiProperty({
        description: 'Full name',
        example: 'John Doe'
    })
    @IsString()
    @MaxLength(255, { message: 'Name must be at most 255 characters long' })
    name: string;

    @ApiProperty({
        description: 'Phone number (optional, E.164 format)',
        example: '+621234567890',
        required: false,
    })
    @IsOptional()
    @IsString()
    @Matches(/^\+?[1-9]\d{1,14}$/, {
        message: 'Phone number must be in valid E.164 format'
    })
    phone?: string;
}