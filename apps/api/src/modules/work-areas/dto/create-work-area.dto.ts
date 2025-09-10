import { 
    IsString, 
    IsEnum, 
    IsOptional, 
    IsUUID, 
    MinLength, 
    MaxLength, 
    IsObject, 
    IsNumber, 
    Min, 
    Max,
    ValidateNested,
    IsArray
  } from 'class-validator';
  import { Type } from 'class-transformer';
  import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
  import { WorkAreaType, WorkAreaStatus } from '../entities/work-area.entity';
  
  export class CoordinatesDto {
    @ApiProperty({ description: 'Latitude', example: -6.2088 })
    @IsNumber()
    @Min(-90)
    @Max(90)
    lat: number;
  
    @ApiProperty({ description: 'Longitude', example: 106.8456 })
    @IsNumber()
    @Min(-180)
    @Max(180)
    lng: number;
  }
  
  export class ContactInfoDto {
    @ApiPropertyOptional({ description: 'Phone number', example: '+6281234567890' })
    @IsOptional()
    @IsString()
    phone?: string;
  
    @ApiPropertyOptional({ description: 'Email address', example: 'area@platform.local' })
    @IsOptional()
    @IsString()
    email?: string;
  
    @ApiPropertyOptional({ description: 'Website URL', example: 'https://area.platform.local' })
    @IsOptional()
    @IsString()
    website?: string;
  
    @ApiPropertyOptional({ description: 'Social media links' })
    @IsOptional()
    @IsObject()
    socialMedia?: Record<string, string>;
  }
  
  export class CreateWorkAreaDto {
    @ApiProperty({ 
      description: 'Work area name', 
      example: 'Kelurahan Menteng',
      minLength: 2,
      maxLength: 150
    })
    @IsString()
    @MinLength(2)
    @MaxLength(150)
    name: string;
  
    @ApiPropertyOptional({ 
      description: 'Work area description',
      example: 'Kelurahan Menteng merupakan wilayah urban di Jakarta Pusat'
    })
    @IsOptional()
    @IsString()
    @MaxLength(1000)
    description?: string;
  
    @ApiProperty({ 
      enum: WorkAreaType, 
      description: 'Type of work area',
      example: WorkAreaType.VILLAGE
    })
    @IsEnum(WorkAreaType)
    type: WorkAreaType;
  
    @ApiProperty({ 
      enum: WorkAreaStatus, 
      description: 'Status of work area',
      example: WorkAreaStatus.ACTIVE,
      default: WorkAreaStatus.ACTIVE
    })
    @IsEnum(WorkAreaStatus)
    @IsOptional()
    status: WorkAreaStatus = WorkAreaStatus.ACTIVE;
  
    @ApiPropertyOptional({ 
      description: 'Area code (postal code, admin code)',
      example: '10310'
    })
    @IsOptional()
    @IsString()
    @MaxLength(20)
    areaCode?: string;
  
    @ApiPropertyOptional({ 
      description: 'Parent work area ID',
      example: 'uuid-of-parent-area'
    })
    @IsOptional()
    @IsUUID()
    parentId?: string;
  
    @ApiPropertyOptional({ 
      description: 'Coordinator user ID',
      example: 'uuid-of-coordinator'
    })
    @IsOptional()
    @IsUUID()
    coordinatorId?: string;
  
    @ApiPropertyOptional({ 
      type: CoordinatesDto,
      description: 'Center point coordinates'
    })
    @IsOptional()
    @ValidateNested()
    @Type(() => CoordinatesDto)
    centerPoint?: CoordinatesDto;
  
    @ApiPropertyOptional({ 
      description: 'Area in square kilometers',
      example: 2.5
    })
    @IsOptional()
    @IsNumber()
    @Min(0)
    areaKm2?: number;
  
    @ApiPropertyOptional({ 
      description: 'Population count',
      example: 15000
    })
    @IsOptional()
    @IsNumber()
    @Min(0)
    population?: number;
  
    @ApiPropertyOptional({ 
      description: 'Number of households',
      example: 3500
    })
    @IsOptional()
    @IsNumber()
    @Min(0)
    householdCount?: number;
  
    @ApiPropertyOptional({ 
      description: 'Target volunteer count',
      example: 50
    })
    @IsOptional()
    @IsNumber()
    @Min(0)
    targetVolunteerCount?: number;
  
    @ApiPropertyOptional({ 
      description: 'Priority level (1-5, 5 being highest)',
      example: 3
    })
    @IsOptional()
    @IsNumber()
    @Min(1)
    @Max(5)
    priorityLevel?: number;
  
    @ApiPropertyOptional({ 
      description: 'Complete address',
      example: 'Jl. MH Thamrin No. 1, Menteng, Jakarta Pusat'
    })
    @IsOptional()
    @IsString()
    @MaxLength(500)
    address?: string;
  
    @ApiPropertyOptional({ 
      type: ContactInfoDto,
      description: 'Contact information'
    })
    @IsOptional()
    @ValidateNested()
    @Type(() => ContactInfoDto)
    contactInfo?: ContactInfoDto;
  
    @ApiPropertyOptional({ 
      description: 'Additional metadata',
      example: { customField: 'value' }
    })
    @IsOptional()
    @IsObject()
    metadata?: Record<string, any>;
  }