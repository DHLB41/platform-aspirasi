import { 
    Injectable, 
    NotFoundException, 
    BadRequestException, 
    ConflictException 
  } from '@nestjs/common';
  import { InjectRepository } from '@nestjs/typeorm';
  import { Repository, Like, Between } from 'typeorm';
  import { Volunteer } from '../modules/volunteers/entities/volunteer.entity';
  import { User } from '../auth/entities/user.entity';
  import { WorkArea } from '../modules/work-areas/entities/work-area.entity';
  import { CreateVolunteerDto } from './dto/create-volunteer.dto';
  import { UpdateVolunteerDto } from './dto/update-volunteer.dto';
  import { QueryVolunteerDto, VolunteerResponseDto } from './dto/query-volunteer.dto';
  import { VolunteerStatus } from '../common/types/volunteer.types';
  
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
  export class VolunteersService {
    constructor(
      @InjectRepository(Volunteer)
      private readonly volunteerRepository: Repository<Volunteer>,
      @InjectRepository(User)
      private readonly userRepository: Repository<User>,
      @InjectRepository(WorkArea)
      private readonly workAreaRepository: Repository<WorkArea>,
    ) {}
  
    /**
     * Create a new volunteer profile
     */
    async create(createVolunteerDto: CreateVolunteerDto): Promise<Volunteer> {
      // Validate user exists
      const user = await this.userRepository.findOne({
        where: { id: createVolunteerDto.userId },
      });
      if (!user) {
        throw new BadRequestException('User not found');
      }
  
      // Check if volunteer profile already exists for this user
      const existingVolunteer = await this.volunteerRepository.findOne({
        where: { userId: createVolunteerDto.userId },
      });
      if (existingVolunteer) {
        throw new ConflictException('Volunteer profile already exists for this user');
      }
  
      // Check NIK uniqueness
      const existingNik = await this.volunteerRepository.findOne({
        where: { nik: createVolunteerDto.nik },
      });
      if (existingNik) {
        throw new ConflictException('NIK already registered');
      }
  
      // Validate work area if provided
      if (createVolunteerDto.workAreaId) {
        const workArea = await this.workAreaRepository.findOne({
          where: { id: createVolunteerDto.workAreaId },
        });
        if (!workArea) {
          throw new BadRequestException('Work area not found');
        }
      }
  
      // Create volunteer
      const volunteer = this.volunteerRepository.create({
        ...createVolunteerDto,
        birthDate: new Date(createVolunteerDto.birthDate),
        status: createVolunteerDto.status || VolunteerStatus.ACTIVE,
      });
  
      return this.volunteerRepository.save(volunteer);
    }
  
    /**
     * Find all volunteers with filtering and pagination
     */
    async findAll(query: QueryVolunteerDto): Promise<PaginatedResult<VolunteerResponseDto>> {
      const {
        page = 1,
        limit = 10,
        search,
        status,
        gender,
        maritalStatus,
        workAreaId,
        education,
        occupation,
        minAge,
        maxAge,
        sortBy = 'name',
        sortOrder = 'ASC',
        includeUser,
        includeWorkArea,
        includeFamilyCount,
        includeDocumentCount,
      } = query;
  
      const queryBuilder = this.volunteerRepository
        .createQueryBuilder('volunteer')
        .leftJoinAndSelect('volunteer.user', 'user');
  
      // Include work area if requested
      if (includeWorkArea) {
        queryBuilder.leftJoinAndSelect('volunteer.workArea', 'workArea');
      }
  
      // Apply filters
      if (search) {
        queryBuilder.andWhere(
          '(user.name ILIKE :search OR user.email ILIKE :search OR volunteer.nik ILIKE :search OR user.phone ILIKE :search)',
          { search: `%${search}%` }
        );
      }
  
      if (status) {
        queryBuilder.andWhere('volunteer.status = :status', { status });
      }
  
      if (gender) {
        queryBuilder.andWhere('volunteer.gender = :gender', { gender });
      }
  
      if (maritalStatus) {
        queryBuilder.andWhere('volunteer.maritalStatus = :maritalStatus', { maritalStatus });
      }
  
      if (workAreaId) {
        queryBuilder.andWhere('volunteer.workAreaId = :workAreaId', { workAreaId });
      }
  
      if (education) {
        queryBuilder.andWhere('volunteer.education ILIKE :education', { education: `%${education}%` });
      }
  
      if (occupation) {
        queryBuilder.andWhere('volunteer.occupation ILIKE :occupation', { occupation: `%${occupation}%` });
      }
  
      // Age filtering
      if (minAge || maxAge) {
        const currentDate = new Date();
        
        if (minAge) {
          const maxBirthDate = new Date(currentDate.getFullYear() - minAge, currentDate.getMonth(), currentDate.getDate());
          queryBuilder.andWhere('volunteer.birthDate <= :maxBirthDate', { maxBirthDate });
        }
        
        if (maxAge) {
          const minBirthDate = new Date(currentDate.getFullYear() - maxAge - 1, currentDate.getMonth(), currentDate.getDate());
          queryBuilder.andWhere('volunteer.birthDate >= :minBirthDate', { minBirthDate });
        }
      }
  
      // Apply sorting
      const validSortFields = ['name', 'nik', 'joinDate', 'createdAt', 'updatedAt'];
      if (sortBy === 'name') {
        queryBuilder.orderBy('user.name', sortOrder);
      } else if (validSortFields.includes(sortBy)) {
        queryBuilder.orderBy(`volunteer.${sortBy}`, sortOrder);
      } else {
        queryBuilder.orderBy('user.name', sortOrder);
      }
  
      // Apply pagination
      const skip = (page - 1) * limit;
      queryBuilder.skip(skip).take(limit);
  
      // Execute query
      const [volunteers, total] = await queryBuilder.getManyAndCount();
  
      // Transform to response DTOs
      const data = await Promise.all(
        volunteers.map(async (volunteer) => this.transformToResponseDto(
          volunteer, 
          { includeUser, includeWorkArea, includeFamilyCount, includeDocumentCount }
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
     * Find volunteer by ID
     */
    async findOne(id: string, includeRelations = true): Promise<Volunteer> {
      const queryBuilder = this.volunteerRepository
        .createQueryBuilder('volunteer')
        .where('volunteer.id = :id', { id });
  
      if (includeRelations) {
        queryBuilder
          .leftJoinAndSelect('volunteer.user', 'user')
          .leftJoinAndSelect('volunteer.workArea', 'workArea')
          .leftJoinAndSelect('volunteer.familyMembers', 'familyMembers')
          .leftJoinAndSelect('volunteer.documents', 'documents');
      }
  
      const volunteer = await queryBuilder.getOne();
  
      if (!volunteer) {
        throw new NotFoundException(`Volunteer with ID "${id}" not found`);
      }
  
      return volunteer;
    }
  
    /**
     * Find volunteer by user ID
     */
    async findByUserId(userId: string): Promise<Volunteer | null> {
      return this.volunteerRepository.findOne({
        where: { userId },
        relations: ['user', 'workArea', 'familyMembers', 'documents'],
      });
    }
  
    /**
     * Find volunteer by NIK
     */
    async findByNik(nik: string): Promise<Volunteer | null> {
      return this.volunteerRepository.findOne({
        where: { nik },
        relations: ['user', 'workArea'],
      });
    }
  
    /**
     * Update volunteer
     */
    async update(id: string, updateVolunteerDto: UpdateVolunteerDto): Promise<Volunteer> {
      const volunteer = await this.findOne(id, false);
  
      // Validate work area if provided and changed
      if (updateVolunteerDto.workAreaId && updateVolunteerDto.workAreaId !== volunteer.workAreaId) {
        const workArea = await this.workAreaRepository.findOne({
          where: { id: updateVolunteerDto.workAreaId },
        });
        if (!workArea) {
          throw new BadRequestException('Work area not found');
        }
      }
  
      // Check NIK uniqueness if changed
      if (updateVolunteerDto.nik && updateVolunteerDto.nik !== volunteer.nik) {
        const existingNik = await this.volunteerRepository.findOne({
          where: { nik: updateVolunteerDto.nik },
        });
        if (existingNik) {
          throw new ConflictException('NIK already registered');
        }
      }
  
      // Convert birth date if provided
      const updateData = { ...updateVolunteerDto };
      if (updateData.birthDate) {
        updateData.birthDate = new Date(updateData.birthDate) as any;
      }
  
      // Update volunteer
      Object.assign(volunteer, updateData);
      
      return this.volunteerRepository.save(volunteer);
    }
  
    /**
     * Delete volunteer
     */
    async remove(id: string): Promise<void> {
      const volunteer = await this.findOne(id, false);
      await this.volunteerRepository.remove(volunteer);
    }
  
    /**
     * Search volunteers
     */
    async search(term: string, limit = 10): Promise<Volunteer[]> {
      const queryBuilder = this.volunteerRepository
        .createQueryBuilder('volunteer')
        .leftJoinAndSelect('volunteer.user', 'user')
        .leftJoinAndSelect('volunteer.workArea', 'workArea');
  
      queryBuilder.where(
        '(user.name ILIKE :term OR user.email ILIKE :term OR volunteer.nik ILIKE :term OR user.phone ILIKE :term)',
        { term: `%${term}%` }
      );
  
      queryBuilder
        .orderBy('user.name', 'ASC')
        .limit(limit);
  
      return queryBuilder.getMany();
    }
  
    /**
     * Get volunteers by work area
     */
    async getByWorkArea(workAreaId: string): Promise<Volunteer[]> {
      return this.volunteerRepository.find({
        where: { workAreaId },
        relations: ['user', 'workArea'],
        order: { joinDate: 'DESC' },
      });
    }
  
    /**
     * Get volunteer statistics
     */
    async getStatistics(): Promise<{
      total: number;
      byStatus: Record<string, number>;
      byGender: Record<string, number>;
      byWorkArea: { workAreaId: string; workAreaName: string; count: number }[];
      recentJoins: number;
    }> {
      const total = await this.volunteerRepository.count();
  
      // By status
      const statusCounts = await this.volunteerRepository
        .createQueryBuilder('volunteer')
        .select('volunteer.status', 'status')
        .addSelect('COUNT(*)', 'count')
        .groupBy('volunteer.status')
        .getRawMany();
  
      const byStatus = statusCounts.reduce((acc, item) => {
        acc[item.status] = parseInt(item.count);
        return acc;
      }, {});
  
      // By gender
      const genderCounts = await this.volunteerRepository
        .createQueryBuilder('volunteer')
        .select('volunteer.gender', 'gender')
        .addSelect('COUNT(*)', 'count')
        .groupBy('volunteer.gender')
        .getRawMany();
  
      const byGender = genderCounts.reduce((acc, item) => {
        acc[item.gender] = parseInt(item.count);
        return acc;
      }, {});
  
      // By work area
      const workAreaCounts = await this.volunteerRepository
        .createQueryBuilder('volunteer')
        .leftJoin('volunteer.workArea', 'workArea')
        .select('workArea.id', 'workAreaId')
        .addSelect('workArea.name', 'workAreaName')
        .addSelect('COUNT(*)', 'count')
        .where('workArea.id IS NOT NULL')
        .groupBy('workArea.id')
        .addGroupBy('workArea.name')
        .getRawMany();
  
      const byWorkArea = workAreaCounts.map(item => ({
        workAreaId: item.workAreaId,
        workAreaName: item.workAreaName,
        count: parseInt(item.count),
      }));
  
      // Recent joins (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
      const recentJoins = await this.volunteerRepository.count({
        where: {
          joinDate: Between(thirtyDaysAgo, new Date()),
        },
      });
  
      return {
        total,
        byStatus,
        byGender,
        byWorkArea,
        recentJoins,
      };
    }
  
    /**
     * Update volunteer status
     */
    async updateStatus(id: string, status: VolunteerStatus, reason?: string): Promise<Volunteer> {
      const volunteer = await this.findOne(id, false);
      
      volunteer.status = status;
      // Could add status reason to metadata
      if (reason) {
        volunteer.metadata = {
          ...volunteer.metadata,
          statusReason: reason,
          statusChangedAt: new Date().toISOString(),
        };
      }
  
      return this.volunteerRepository.save(volunteer);
    }
  
    // Private helper methods
  
    private async transformToResponseDto(
      volunteer: Volunteer, 
      options: { 
        includeUser?: boolean; 
        includeWorkArea?: boolean; 
        includeFamilyCount?: boolean; 
        includeDocumentCount?: boolean;
      } = {}
    ): Promise<VolunteerResponseDto> {
      const dto: VolunteerResponseDto = {
        id: volunteer.id,
        userId: volunteer.userId,
        nik: volunteer.nik,
        birthDate: volunteer.birthDate,
        birthPlace: volunteer.birthPlace,
        gender: volunteer.gender,
        maritalStatus: volunteer.maritalStatus,
        address: volunteer.address,
        rt: volunteer.rt,
        rw: volunteer.rw,
        village: volunteer.village,
        district: volunteer.district,
        city: volunteer.city,
        province: volunteer.province,
        postalCode: volunteer.postalCode,
        education: volunteer.education,
        occupation: volunteer.occupation,
        emergencyContactName: volunteer.emergencyContactName,
        emergencyContactPhone: volunteer.emergencyContactPhone,
        skills: volunteer.skills,
        bio: volunteer.bio,
        joinDate: volunteer.joinDate,
        status: volunteer.status,
        workAreaId: volunteer.workAreaId,
        profilePhotoUrl: volunteer.profilePhotoUrl,
        documentCompletionPercentage: volunteer.documentCompletionPercentage,
        lastActivityAt: volunteer.lastActivityAt,
        createdAt: volunteer.createdAt,
        updatedAt: volunteer.updatedAt,
      };
  
      // Add calculated age
      if (volunteer.birthDate) {
        const today = new Date();
        const birth = new Date(volunteer.birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
          age--;
        }
        dto.age = age;
      }
  
      // Add user details if available and requested
      if (options.includeUser && volunteer.user) {
        dto.fullName = volunteer.user.name;
        dto.email = volunteer.user.email;
        dto.phone = volunteer.user.phone;
      }
  
      // Add work area details if available and requested
      if (options.includeWorkArea && volunteer.workArea) {
        dto.workArea = {
          id: volunteer.workArea.id,
          name: volunteer.workArea.name,
          type: volunteer.workArea.type,
        };
      }
  
      // Add counts if requested
      if (options.includeFamilyCount) {
        dto.familyMembersCount = volunteer.familyMembers?.length || 0;
      }
  
      if (options.includeDocumentCount) {
        dto.documentsCount = volunteer.documents?.length || 0;
      }
  
      // Add profile completion
      dto.profileCompletion = this.calculateProfileCompletion(volunteer);
  
      return dto;
    }
  
    private calculateProfileCompletion(volunteer: Volunteer): {
      percentage: number;
      missingFields: string[];
    } {
      const requiredFields = [
        { field: 'nik', value: volunteer.nik, label: 'NIK' },
        { field: 'birthDate', value: volunteer.birthDate, label: 'Tanggal Lahir' },
        { field: 'birthPlace', value: volunteer.birthPlace, label: 'Tempat Lahir' },
        { field: 'address', value: volunteer.address, label: 'Alamat' },
        { field: 'emergencyContactName', value: volunteer.emergencyContactName, label: 'Kontak Darurat Nama' },
        { field: 'emergencyContactPhone', value: volunteer.emergencyContactPhone, label: 'Kontak Darurat Telepon' },
      ];
  
      const optionalFields = [
        { field: 'education', value: volunteer.education, label: 'Pendidikan' },
        { field: 'occupation', value: volunteer.occupation, label: 'Pekerjaan' },
        { field: 'workAreaId', value: volunteer.workAreaId, label: 'Area Kerja' },
        { field: 'bio', value: volunteer.bio, label: 'Bio' },
      ];
  
      const allFields = [...requiredFields, ...optionalFields];
      
      const completedFields = allFields.filter(field => 
        field.value !== null && 
        field.value !== undefined && 
        field.value !== ''
      );
  
      const missingFields = allFields
        .filter(field => !field.value)
        .map(field => field.label);
  
      const percentage = Math.round((completedFields.length / allFields.length) * 100);
  
      return {
        percentage,
        missingFields,
      };
    }
  }