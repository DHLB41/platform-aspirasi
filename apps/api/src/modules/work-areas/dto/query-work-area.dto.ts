import { IsOptional, IsEnum, IsString, IsUUID, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { WorkAreaType, WorkAreaStatus } from '../entities/work-area.entity';

export class QueryWorkAreaDto {
  @ApiPropertyOptional({ 
    description: 'Page number',
    example: 1,
    minimum: 1
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ 
    description: 'Items per page',
    example: 10,
    minimum: 1,
    maximum: 100
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({ 
    description: 'Search by name',
    example: 'Menteng'
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ 
    enum: WorkAreaType,
    description: 'Filter by work area type'
  })
  @IsOptional()
  @IsEnum(WorkAreaType)
  type?: WorkAreaType;

  @ApiPropertyOptional({ 
    enum: WorkAreaStatus,
    description: 'Filter by status'
  })
  @IsOptional()
  @IsEnum(WorkAreaStatus)
  status?: WorkAreaStatus;

  @ApiPropertyOptional({ 
    description: 'Filter by parent work area ID',
    example: 'uuid-of-parent'
  })
  @IsOptional()
  @IsUUID()
  parentId?: string;

  @ApiPropertyOptional({ 
    description: 'Filter by coordinator ID',
    example: 'uuid-of-coordinator'
  })
  @IsOptional()
  @IsUUID()
  coordinatorId?: string;

  @ApiPropertyOptional({ 
    description: 'Filter by area code',
    example: '10310'
  })
  @IsOptional()
  @IsString()
  areaCode?: string;

  @ApiPropertyOptional({ 
    description: 'Sort by field',
    example: 'name',
    enum: ['name', 'type', 'status', 'createdAt', 'updatedAt', 'priorityLevel']
  })
  @IsOptional()
  @IsString()
  sortBy?: string = 'name';

  @ApiPropertyOptional({ 
    description: 'Sort order',
    example: 'ASC',
    enum: ['ASC', 'DESC']
  })
  @IsOptional()
  @IsString()
  sortOrder?: 'ASC' | 'DESC' = 'ASC';

  @ApiPropertyOptional({ 
    description: 'Include only root areas (no parent)',
    example: false
  })
  @IsOptional()
  @Type(() => Boolean)
  rootOnly?: boolean;

  @ApiPropertyOptional({ 
    description: 'Include children count',
    example: true
  })
  @IsOptional()
  @Type(() => Boolean)
  includeChildrenCount?: boolean;

  @ApiPropertyOptional({ 
    description: 'Include volunteer count',
    example: true
  })
  @IsOptional()
  @Type(() => Boolean)
  includeVolunteerCount?: boolean;
}

export class WorkAreaResponseDto {
  @ApiPropertyOptional({ description: 'Work area ID' })
  id: string;

  @ApiPropertyOptional({ description: 'Work area name' })
  name: string;

  @ApiPropertyOptional({ description: 'Work area description' })
  description?: string;

  @ApiPropertyOptional({ enum: WorkAreaType, description: 'Work area type' })
  type: WorkAreaType;

  @ApiPropertyOptional({ enum: WorkAreaStatus, description: 'Work area status' })
  status: WorkAreaStatus;

  @ApiPropertyOptional({ description: 'Area code' })
  areaCode?: string;

  @ApiPropertyOptional({ description: 'Parent work area ID' })
  parentId?: string;

  @ApiPropertyOptional({ description: 'Coordinator user ID' })
  coordinatorId?: string;

  @ApiPropertyOptional({ description: 'Center point coordinates' })
  centerPoint?: { lat: number; lng: number };

  @ApiPropertyOptional({ description: 'Area in square kilometers' })
  areaKm2?: number;

  @ApiPropertyOptional({ description: 'Population count' })
  population?: number;

  @ApiPropertyOptional({ description: 'Number of households' })
  householdCount?: number;

  @ApiPropertyOptional({ description: 'Target volunteer count' })
  targetVolunteerCount?: number;

  @ApiPropertyOptional({ description: 'Priority level' })
  priorityLevel?: number;

  @ApiPropertyOptional({ description: 'Complete address' })
  address?: string;

  @ApiPropertyOptional({ description: 'Contact information' })
  contactInfo?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  metadata?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiPropertyOptional({ description: 'Last update timestamp' })
  updatedAt: Date;

  // Dynamic fields
  @ApiPropertyOptional({ description: 'Number of child areas' })
  childrenCount?: number;

  @ApiPropertyOptional({ description: 'Number of volunteers' })
  volunteerCount?: number;

  @ApiPropertyOptional({ description: 'Coordinator information' })
  coordinator?: {
    id: string;
    name: string;
    email: string;
  };

  @ApiPropertyOptional({ description: 'Parent area information' })
  parent?: {
    id: string;
    name: string;
    type: WorkAreaType;
  };
}