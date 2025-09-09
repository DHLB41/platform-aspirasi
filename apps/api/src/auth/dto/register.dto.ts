import { IsEmail, IsString, IsPhoneNumber, MinLength, MaxLength, Matches, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ description: 'Full name', example: 'John Doe' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({ description: 'Email address', example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ 
    description: 'Password (min 8 chars, must include uppercase, lowercase, number, special char)',
    example: 'Password123!@#'
  })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    {
      message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    },
  )
  password: string;

  @ApiProperty({ 
    description: 'Password confirmation',
    example: 'Password123!@#'
  })
  @IsString()
  passwordConfirmation: string;

  @ApiProperty({ 
    description: 'Phone number (Indonesian format)', 
    example: '+6281234567890',
    required: false 
  })
  @IsOptional()
  @IsString()
  @Matches(/^\+62[0-9]{8,12}$/, {
    message: 'Phone number must be in Indonesian format (+62xxxxxxxxxx)',
  })
  phone?: string;
}
