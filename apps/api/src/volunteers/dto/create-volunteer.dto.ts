import { 
    IsString, 
    IsEnum, 
    IsOptional, 
    IsUUID, 
    MinLength, 
    MaxLength, 
    IsDateString,
    IsArray,
    Matches
  } from 'class-validator';
  import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
  import { Gender, MaritalStatus, VolunteerStatus } from '../../common/types/volunteer.types';
  
  export class CreateVolunteerDto {
    @ApiProperty({ description: 'User ID reference' })
    @IsUUID()
    userId: string;
  
    @ApiProperty({ description: 'NIK (16 digits)', example: '3171234567890123' })
    @IsString()
    @Matches(/^[0-9]{16}$/, { message: 'NIK must be exactly 16 digits' })
    nik: string;
  
    @ApiProperty({ description: 'Birth date', example: '1990-01-01' })
    @IsDateString()
    birthDate: string;
  
    @ApiProperty({ description: 'Birth place', example: 'Jakarta' })
    @IsString()
    @MinLength(2)
    @MaxLength(100)
    birthPlace: string;
  
    @ApiProperty({ enum: Gender, description: 'Gender' })
    @IsEnum(Gender)
    gender: Gender;
  
    @ApiProperty({ enum: MaritalStatus, description: 'Marital status' })
    @IsEnum(MaritalStatus)
    @IsOptional()
    maritalStatus?: MaritalStatus;
  
    @ApiProperty({ description: 'Complete address' })
    @IsString()
    @MinLength(10)
    address: string;
  
    @ApiPropertyOptional({ description: 'RT number', example: '001' })
    @IsOptional()
    @IsString()
    @MaxLength(3)
    rt?: string;
  
    @ApiPropertyOptional({ description: 'RW number', example: '002' })
    @IsOptional()
    @IsString()
    @MaxLength(3)
    rw?: string;
  
    @ApiPropertyOptional({ description: 'Village/Kelurahan' })
    @IsOptional()
    @IsString()
    @MaxLength(100)
    village?: string;
  
    @ApiPropertyOptional({ description: 'District/Kecamatan' })
    @IsOptional()
    @IsString()
    @MaxLength(100)
    district?: string;
  
    @ApiPropertyOptional({ description: 'City/Kabupaten' })
    @IsOptional()
    @IsString()
    @MaxLength(100)
    city?: string;
  
    @ApiPropertyOptional({ description: 'Province' })
    @IsOptional()
    @IsString()
    @MaxLength(100)
    province?: string;
  
    @ApiPropertyOptional({ description: 'Postal code' })
    @IsOptional()
    @IsString()
    @MaxLength(5)
    postalCode?: string;
  
    @ApiPropertyOptional({ description: 'Education level' })
    @IsOptional()
    @IsString()
    @MaxLength(50)
    education?: string;
  
    @ApiPropertyOptional({ description: 'Occupation' })
    @IsOptional()
    @IsString()
    @MaxLength(100)
    occupation?: string;
  
    @ApiPropertyOptional({ description: 'Emergency contact name' })
    @IsOptional()
    @IsString()
    @MaxLength(100)
    emergencyContactName?: string;
  
    @ApiPropertyOptional({ description: 'Emergency contact phone' })
    @IsOptional()
    @IsString()
    @Matches(/^\+62[0-9]{8,12}$/, { message: 'Invalid Indonesian phone format' })
    emergencyContactPhone?: string;
  
    @ApiPropertyOptional({ description: 'Skills array', type: [String] })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    skills?: string[];
  
    @ApiPropertyOptional({ description: 'Bio/description' })
    @IsOptional()
    @IsString()
    @MaxLength(1000)
    bio?: string;
  
    @ApiPropertyOptional({ description: 'Work area ID' })
    @IsOptional()
    @IsUUID()
    workAreaId?: string;
  
    @ApiProperty({ enum: VolunteerStatus, description: 'Volunteer status' })
    @IsEnum(VolunteerStatus)
    @IsOptional()
    status?: VolunteerStatus;
  }
  