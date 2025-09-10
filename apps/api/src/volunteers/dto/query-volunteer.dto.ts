import { IsOptional, IsEnum, IsString, IsUUID, IsNumber, Min, Max, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Gender, MaritalStatus, VolunteerStatus } from '../../common/types/volunteer.types';

export class QueryVolunteerDto {
  @ApiPropertyOptional({ description: 'Page number', example: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', example: 10, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Search by name, email, NIK, or phone' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: VolunteerStatus, description: 'Filter by status' })
  @IsOptional()
  @IsEnum(VolunteerStatus)
  status?: VolunteerStatus;

  @ApiPropertyOptional({ enum: Gender, description: 'Filter by gender' })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiPropertyOptional({ enum: MaritalStatus, description: 'Filter by marital status' })
  @IsOptional()
  @IsEnum(MaritalStatus)
  maritalStatus?: MaritalStatus;

  @ApiPropertyOptional({ description: 'Filter by work area ID' })
  @IsOptional()
  @IsUUID()
  workAreaId?: string;

  @ApiPropertyOptional({ description: 'Filter by education level' })
  @IsOptional()
  @IsString()
  education?: string;

  @ApiPropertyOptional({ description: 'Filter by occupation' })
  @IsOptional()
  @IsString()
  occupation?: string;

  @ApiPropertyOptional({ description: 'Filter by age range - minimum age' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(17)
  @Max(100)
  minAge?: number;

  @ApiPropertyOptional({ description: 'Filter by age range - maximum age' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(17)
  @Max(100)
  maxAge?: number;

  @ApiPropertyOptional({ description: 'Sort by field', enum: ['name', 'nik', 'age', 'joinDate', 'createdAt', 'updatedAt'] })
  @IsOptional()
  @IsString()
  sortBy?: string = 'name';

  @ApiPropertyOptional({ description: 'Sort order', enum: ['ASC', 'DESC'] })
  @IsOptional()
  @IsString()
  sortOrder?: 'ASC' | 'DESC' = 'ASC';

  @ApiPropertyOptional({ description: 'Include user details' })
  @IsOptional()
  @Type(() => Boolean)
  includeUser?: boolean;

  @ApiPropertyOptional({ description: 'Include work area details' })
  @IsOptional()
  @Type(() => Boolean)
  includeWorkArea?: boolean;

  @ApiPropertyOptional({ description: 'Include family members count' })
  @IsOptional()
  @Type(() => Boolean)
  includeFamilyCount?: boolean;

  @ApiPropertyOptional({ description: 'Include documents count' })
  @IsOptional()
  @Type(() => Boolean)
  includeDocumentCount?: boolean;
}

export class VolunteerResponseDto {
  @ApiPropertyOptional({ description: 'Volunteer ID' })
  id: string;

  @ApiPropertyOptional({ description: 'User ID' })
  userId: string;

  @ApiPropertyOptional({ description: 'NIK' })
  nik: string;

  @ApiPropertyOptional({ description: 'Birth date' })
  birthDate: Date;

  @ApiPropertyOptional({ description: 'Birth place' })
  birthPlace: string;

  @ApiPropertyOptional({ enum: Gender, description: 'Gender' })
  gender: Gender;

  @ApiPropertyOptional({ enum: MaritalStatus, description: 'Marital status' })
  maritalStatus: MaritalStatus;

  @ApiPropertyOptional({ description: 'Complete address' })
  address: string;

  @ApiPropertyOptional({ description: 'RT number' })
  rt?: string;

  @ApiPropertyOptional({ description: 'RW number' })
  rw?: string;

  @ApiPropertyOptional({ description: 'Village/Kelurahan' })
  village?: string;

  @ApiPropertyOptional({ description: 'District/Kecamatan' })
  district?: string;

  @ApiPropertyOptional({ description: 'City/Kabupaten' })
  city?: string;

  @ApiPropertyOptional({ description: 'Province' })
  province?: string;

  @ApiPropertyOptional({ description: 'Postal code' })
  postalCode?: string;

  @ApiPropertyOptional({ description: 'Education level' })
  education?: string;

  @ApiPropertyOptional({ description: 'Occupation' })
  occupation?: string;

  @ApiPropertyOptional({ description: 'Emergency contact name' })
  emergencyContactName?: string;

  @ApiPropertyOptional({ description: 'Emergency contact phone' })
  emergencyContactPhone?: string;

  @ApiPropertyOptional({ description: 'Skills array' })
  skills?: string[];

  @ApiPropertyOptional({ description: 'Bio/description' })
  bio?: string;

  @ApiPropertyOptional({ description: 'Join date' })
  joinDate: Date;

  @ApiPropertyOptional({ enum: VolunteerStatus, description: 'Status' })
  status: VolunteerStatus;

  @ApiPropertyOptional({ description: 'Work area ID' })
  workAreaId?: string;

  @ApiPropertyOptional({ description: 'Profile photo URL' })
  profilePhotoUrl?: string;

  @ApiPropertyOptional({ description: 'Document completion percentage' })
  documentCompletionPercentage: number;

  @ApiPropertyOptional({ description: 'Last activity timestamp' })
  lastActivityAt?: Date;

  @ApiPropertyOptional({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiPropertyOptional({ description: 'Last update timestamp' })
  updatedAt: Date;

  // Dynamic fields
  @ApiPropertyOptional({ description: 'Age calculated from birth date' })
  age?: number;

  @ApiPropertyOptional({ description: 'Full name from user' })
  fullName?: string;

  @ApiPropertyOptional({ description: 'Email from user' })
  email?: string;

  @ApiPropertyOptional({ description: 'Phone from user' })
  phone?: string;

  @ApiPropertyOptional({ description: 'Work area details' })
  workArea?: {
    id: string;
    name: string;
    type: string;
  };

  @ApiPropertyOptional({ description: 'Family members count' })
  familyMembersCount?: number;

  @ApiPropertyOptional({ description: 'Documents count' })
  documentsCount?: number;

  @ApiPropertyOptional({ description: 'Profile completion status' })
  profileCompletion?: {
    percentage: number;
    missingFields: string[];
  };
}