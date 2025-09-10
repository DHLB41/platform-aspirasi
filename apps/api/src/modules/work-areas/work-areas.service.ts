import { 
    Injectable, 
    NotFoundException, 
    BadRequestException, 
    ConflictException 
  } from '@nestjs/common';
  import { InjectRepository } from '@nestjs/typeorm';
  import { Repository, FindManyOptions, Like, IsNull, Not } from 'typeorm';
  import { WorkArea, WorkAreaStatus } from './entities/work-area.entity';
  import { User } from '../../auth/entities/user.entity';
  import { CreateWorkAreaDto } from './dto/create-work-area.dto';
  import { UpdateWorkAreaDto } from './dto/update-work-area.dto';
  import { QueryWorkAreaDto, WorkAreaResponseDto } from './dto/query-work-area.dto';
  
  export interface PaginatedResult<T> {
    data: T[];
    meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  }
  
  @Injectable()
  export class WorkAreasService {
    constructor(
      @InjectRepository(WorkArea)
      private readonly workAreaRepository: Repository<WorkArea>,
      @InjectRepository(User)
      private readonly userRepository: Repository<User>,
    ) {}
  
    /**
     * Create a new work area
     */
    async create(createWorkAreaDto: CreateWorkAreaDto): Promise<WorkArea> {
      // Validate parent exists if provided
      if (createWorkAreaDto.parentId) {
        const parent = await this.findOne(createWorkAreaDto.parentId);
        if (!parent) {
          throw new BadRequestException('Parent work area not found');
        }
      }
  
      // Validate coordinator exists if provided
      if (createWorkAreaDto.coordinatorId) {
        const coordinator = await this.userRepository.findOne({
          where: { id: createWorkAreaDto.coordinatorId },
        });
        if (!coordinator) {
          throw new BadRequestException('Coordinator user not found');
        }
      }
  
      // Check for duplicate name in same parent area
      await this.validateUniqueNameInParent(
        createWorkAreaDto.name, 
        createWorkAreaDto.parentId
      );
  
      // Create work area
      const workArea = this.workAreaRepository.create(createWorkAreaDto);
      
      return this.workAreaRepository.save(workArea);
    }
  
    /**
     * Find all work areas with filtering and pagination
     */
    async findAll(query: QueryWorkAreaDto): Promise<PaginatedResult<WorkAreaResponseDto>> {
      const {
        page = 1,
        limit = 10,
        search,
        type,
        status,
        parentId,
        coordinatorId,
        areaCode,
        sortBy = 'name',
        sortOrder = 'ASC',
        rootOnly,
        includeChildrenCount,
        includeVolunteerCount,
      } = query;
  
      const queryBuilder = this.workAreaRepository
        .createQueryBuilder('workArea')
        .leftJoinAndSelect('workArea.coordinator', 'coordinator')
        .leftJoinAndSelect('workArea.parent', 'parent');
  
      // Apply filters
      if (search) {
        queryBuilder.andWhere(
          '(workArea.name ILIKE :search OR workArea.description ILIKE :search OR workArea.areaCode ILIKE :search)',
          { search: `%${search}%` }
        );
      }
  
      if (type) {
        queryBuilder.andWhere('workArea.type = :type', { type });
      }
  
      if (status) {
        queryBuilder.andWhere('workArea.status = :status', { status });
      }
  
      if (parentId) {
        queryBuilder.andWhere('workArea.parentId = :parentId', { parentId });
      }
  
      if (coordinatorId) {
        queryBuilder.andWhere('workArea.coordinatorId = :coordinatorId', { coordinatorId });
      }
  
      if (areaCode) {
        queryBuilder.andWhere('workArea.areaCode = :areaCode', { areaCode });
      }
  
      if (rootOnly) {
        queryBuilder.andWhere('workArea.parentId IS NULL');
      }
  
      // Apply sorting
      const validSortFields = ['name', 'type', 'status', 'createdAt', 'updatedAt', 'priorityLevel'];
      const sortField = validSortFields.includes(sortBy) ? sortBy : 'name';
      queryBuilder.orderBy(`workArea.${sortField}`, sortOrder);
  
      // Apply pagination
      const skip = (page - 1) * limit;
      queryBuilder.skip(skip).take(limit);
  
      // Execute query
      const [workAreas, total] = await queryBuilder.getManyAndCount();
  
      // Transform to response DTOs
      const data = await Promise.all(
        workAreas.map(async (workArea) => this.transformToResponseDto(
          workArea, 
          { includeChildrenCount, includeVolunteerCount }
        ))
      );
  
      // Calculate pagination meta
      const totalPages = Math.ceil(total / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;
  
      return {
        data,
        meta: {
          total,
          page,
          limit,
          totalPages,
          hasNextPage,
          hasPrevPage,
        },
      };
    }
  
    /**
     * Find work area by ID
     */
    async findOne(id: string, includeRelations = true): Promise<WorkArea> {
      const queryBuilder = this.workAreaRepository
        .createQueryBuilder('workArea')
        .where('workArea.id = :id', { id });
  
      if (includeRelations) {
        queryBuilder
          .leftJoinAndSelect('workArea.coordinator', 'coordinator')
          .leftJoinAndSelect('workArea.parent', 'parent')
          .leftJoinAndSelect('workArea.children', 'children')
          .leftJoinAndSelect('workArea.volunteers', 'volunteers');
      }
  
      const workArea = await queryBuilder.getOne();
  
      if (!workArea) {
        throw new NotFoundException(`Work area with ID "${id}" not found`);
      }
  
      return workArea;
    }
  
    /**
     * Update work area
     */
    async update(id: string, updateWorkAreaDto: UpdateWorkAreaDto): Promise<WorkArea> {
      const workArea = await this.findOne(id, false);
  
      // Validate parent exists if provided and changed
      if (updateWorkAreaDto.parentId && updateWorkAreaDto.parentId !== workArea.parentId) {
        // Prevent self-reference
        if (updateWorkAreaDto.parentId === id) {
          throw new BadRequestException('Work area cannot be its own parent');
        }
  
        // Prevent circular reference
        await this.validateNoCircularReference(id, updateWorkAreaDto.parentId);
  
        const parent = await this.findOne(updateWorkAreaDto.parentId);
        if (!parent) {
          throw new BadRequestException('Parent work area not found');
        }
      }
  
      // Validate coordinator exists if provided
      if (updateWorkAreaDto.coordinatorId) {
        const coordinator = await this.userRepository.findOne({
          where: { id: updateWorkAreaDto.coordinatorId },
        });
        if (!coordinator) {
          throw new BadRequestException('Coordinator user not found');
        }
      }
  
      // Check for duplicate name if name is being changed
      if (updateWorkAreaDto.name && updateWorkAreaDto.name !== workArea.name) {
        await this.validateUniqueNameInParent(
          updateWorkAreaDto.name, 
          updateWorkAreaDto.parentId || workArea.parentId,
          id
        );
      }
  
      // Update work area
      Object.assign(workArea, updateWorkAreaDto);
      
      return this.workAreaRepository.save(workArea);
    }
  
    /**
     * Delete work area
     */
    async remove(id: string): Promise<void> {
      const workArea = await this.findOne(id);
  
      // Check if work area has children
      const childCount = await this.workAreaRepository.count({
        where: { parentId: id },
      });
  
      if (childCount > 0) {
        throw new ConflictException(
          'Cannot delete work area that has child areas. Please delete or reassign child areas first.'
        );
      }
  
      // Check if work area has volunteers
      // Note: We'll implement this when volunteer entity is ready
      // const volunteerCount = await this.volunteerRepository.count({
      //   where: { workAreaId: id },
      // });
  
      // if (volunteerCount > 0) {
      //   throw new ConflictException(
      //     'Cannot delete work area that has volunteers. Please reassign volunteers first.'
      //   );
      // }
  
      await this.workAreaRepository.remove(workArea);
    }
  
    /**
     * Get children of a work area
     */
    async getChildren(id: string): Promise<WorkArea[]> {
      await this.findOne(id, false); // Validate parent exists
  
      return this.workAreaRepository.find({
        where: { parentId: id },
        relations: ['coordinator'],
        order: { name: 'ASC' },
      });
    }
  
    /**
     * Get full hierarchy of work areas
     */
    async getHierarchy(): Promise<WorkArea[]> {
      // Get all root areas (no parent) with their children
      return await this.workAreaRepository.find({
              where: { parentId: IsNull() },
              relations: ['children', 'children.children', 'coordinator'],
              order: { name: 'ASC' },
            });
    }
  
    /**
     * Get ancestors of a work area (breadcrumb)
     */
    async getAncestors(id: string): Promise<WorkArea[]> {
      const workArea = await this.findOne(id);
      const ancestors: WorkArea[] = [];
      
      let current = workArea;
      while (current.parent) {
        ancestors.unshift(current.parent);
        current = await this.findOne(current.parent.id, false);
      }
  
      return ancestors;
    }
  
    /**
     * Search work areas by name or area code
     */
    async search(term: string, limit: number = 10): Promise<WorkArea[]> {
      try {
        const safeLimit = Math.min(1, Math.min(100, Number(limit) || 10));

        return await this.workAreaRepository.find({
          where: [
            { name: Like(`%${term}%`) },
            { areaCode: Like(`%${term}%`) },
          ],
          take: safeLimit,
          order: { name: 'ASC' },
        });
      } catch (error) {
        console.error('Error searching work areas:', error);
        throw error;
      }
    }
  
    /**
     * Assign coordinator to work area
     */
    async assignCoordinator(workAreaId: string, coordinatorId: string): Promise<WorkArea> {
      const workArea = await this.findOne(workAreaId, false);
      
      const coordinator = await this.userRepository.findOne({
        where: { id: coordinatorId },
      });
      
      if (!coordinator) {
        throw new NotFoundException('Coordinator not found');
      }
  
      workArea.coordinatorId = coordinatorId;
      return this.workAreaRepository.save(workArea);
    }
  
    /**
     * Remove coordinator from work area
     */
    async removeCoordinator(workAreaId: string): Promise<WorkArea> {
      const workArea = await this.findOne(workAreaId, false);
      workArea.coordinatorId = null;
      return this.workAreaRepository.save(workArea);
    }
  
    // Private helper methods
  
    private async validateUniqueNameInParent(
      name: string, 
      parentId?: string, 
      excludeId?: string
    ): Promise<void> {
      const whereCondition: any = { name };
      
      if (parentId) {
        whereCondition.parentId = parentId;
      } else {
        whereCondition.parentId = IsNull();
      }
  
      if (excludeId) {
        whereCondition.id = Not(excludeId);
      }
  
      const existing = await this.workAreaRepository.findOne({
        where: whereCondition,
      });
  
      if (existing) {
        throw new ConflictException(
          `Work area with name "${name}" already exists in this parent area`
        );
      }
    }
  
    private async validateNoCircularReference(areaId: string, parentId: string): Promise<void> {
      let currentParentId = parentId;
      const visited = new Set<string>();
  
      while (currentParentId) {
        if (visited.has(currentParentId)) {
          throw new BadRequestException('Circular reference detected in work area hierarchy');
        }
  
        if (currentParentId === areaId) {
          throw new BadRequestException('Cannot set descendant as parent (circular reference)');
        }
  
        visited.add(currentParentId);
  
        const parent = await this.workAreaRepository.findOne({
          where: { id: currentParentId },
          select: ['id', 'parentId'],
        });
  
        if (!parent) {
          break;
        }
  
        currentParentId = parent.parentId;
      }
    }
  
    private async transformToResponseDto(
      workArea: WorkArea, 
      options: { includeChildrenCount?: boolean; includeVolunteerCount?: boolean } = {}
    ): Promise<WorkAreaResponseDto> {
      const dto: WorkAreaResponseDto = {
        id: workArea.id,
        name: workArea.name,
        description: workArea.description,
        type: workArea.type,
        status: workArea.status,
        areaCode: workArea.areaCode,
        parentId: workArea.parentId,
        coordinatorId: workArea.coordinatorId,
        centerPoint: workArea.centerPoint,
        areaKm2: workArea.areaKm2,
        population: workArea.population,
        householdCount: workArea.householdCount,
        targetVolunteerCount: workArea.targetVolunteerCount,
        priorityLevel: workArea.priorityLevel,
        address: workArea.address,
        contactInfo: workArea.contactInfo,
        metadata: workArea.metadata,
        createdAt: workArea.createdAt,
        updatedAt: workArea.updatedAt,
      };
  
      // Add coordinator info if available
      if (workArea.coordinator) {
        dto.coordinator = {
          id: workArea.coordinator.id,
          name: workArea.coordinator.name,
          email: workArea.coordinator.email,
        };
      }
  
      // Add parent info if available
      if (workArea.parent) {
        dto.parent = {
          id: workArea.parent.id,
          name: workArea.parent.name,
          type: workArea.parent.type,
        };
      }
  
      // Add children count if requested
      if (options.includeChildrenCount) {
        dto.childrenCount = await this.workAreaRepository.count({
          where: { parentId: workArea.id },
        });
      }
  
      // Add volunteer count if requested
      if (options.includeVolunteerCount) {
        // TODO: Implement when volunteer entity is ready
        // dto.volunteerCount = await this.volunteerRepository.count({
        //   where: { workAreaId: workArea.id },
        // });
        dto.volunteerCount = 0; // Placeholder
      }
  
      return dto;
    }
  }