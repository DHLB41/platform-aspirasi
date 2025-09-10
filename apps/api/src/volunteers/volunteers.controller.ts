import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    Query,
    UseGuards,
    ParseUUIDPipe,
    HttpCode,
    HttpStatus,
  } from '@nestjs/common';
  import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiParam,
    ApiQuery,
  } from '@nestjs/swagger';
  import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
  import { RolesGuard } from '../auth/guards/roles.guard';
  import { Roles } from '../auth/decorators/roles.decorator';
  import { GetUser } from '../auth/decorators/get-user.decorator';
  import { UserRole, User } from '../auth/entities/user.entity';
  import { ResponseDto } from '../auth/dto/auth-response.dto';
  import { VolunteersService } from '../volunteers/volunteers.service';
  import { CreateVolunteerDto } from './dto/create-volunteer.dto';
  import { UpdateVolunteerDto } from './dto/update-volunteer.dto';
  import { QueryVolunteerDto, VolunteerResponseDto } from './dto/query-volunteer.dto';
  import { Volunteer } from '../modules/volunteers/entities/volunteer.entity';
  import { VolunteerStatus } from '../common/types/volunteer.types';
  
  @ApiTags('volunteers')
  @Controller('volunteers')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  export class VolunteersController {
    constructor(private readonly volunteersService: VolunteersService) {}
  
    @Post()
    @Roles(UserRole.ADMIN, UserRole.VOLUNTEER)
    @ApiOperation({ summary: 'Create a new volunteer profile' })
    @ApiResponse({
      status: 201,
      description: 'Volunteer profile created successfully',
      type: ResponseDto,
    })
    @ApiResponse({ status: 400, description: 'Bad request - validation errors' })
    @ApiResponse({ status: 409, description: 'Conflict - NIK or user already exists' })
    async create(
      @Body() createVolunteerDto: CreateVolunteerDto,
      @GetUser() user: User,
    ): Promise<ResponseDto<Volunteer>> {
      const volunteer = await this.volunteersService.create(createVolunteerDto);
      return ResponseDto.success('Volunteer profile created successfully', volunteer);
    }
  
    @Get()
    @Roles(UserRole.ADMIN, UserRole.VOLUNTEER)
    @ApiOperation({ summary: 'Get all volunteers with filtering and pagination' })
    @ApiResponse({
      status: 200,
      description: 'Volunteers retrieved successfully',
      type: ResponseDto,
    })
    @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
    @ApiQuery({ name: 'search', required: false, type: String, description: 'Search term' })
    @ApiQuery({ name: 'status', required: false, enum: VolunteerStatus })
    @ApiQuery({ name: 'gender', required: false, enum: ['male', 'female'] })
    @ApiQuery({ name: 'workAreaId', required: false, type: String, description: 'Work area ID' })
    @ApiQuery({ name: 'minAge', required: false, type: Number, description: 'Minimum age' })
    @ApiQuery({ name: 'maxAge', required: false, type: Number, description: 'Maximum age' })
    @ApiQuery({ name: 'sortBy', required: false, type: String, description: 'Sort field' })
    @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'] })
    @ApiQuery({ name: 'includeUser', required: false, type: Boolean })
    @ApiQuery({ name: 'includeWorkArea', required: false, type: Boolean })
    async findAll(
      @Query() query: QueryVolunteerDto,
    ): Promise<ResponseDto<{ data: VolunteerResponseDto[]; meta: any }>> {
      const result = await this.volunteersService.findAll(query);
      return ResponseDto.success('Volunteers retrieved successfully', result);
    }
  
    @Get('statistics')
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Get volunteer statistics' })
    @ApiResponse({
      status: 200,
      description: 'Statistics retrieved successfully',
      type: ResponseDto,
    })
    async getStatistics(): Promise<ResponseDto<any>> {
      const statistics = await this.volunteersService.getStatistics();
      return ResponseDto.success('Statistics retrieved successfully', statistics);
    }
  
    @Get('search')
    @Roles(UserRole.ADMIN, UserRole.VOLUNTEER)
    @ApiOperation({ summary: 'Search volunteers by name, email, NIK, or phone' })
    @ApiResponse({
      status: 200,
      description: 'Search results retrieved successfully',
      type: ResponseDto,
    })
    @ApiQuery({ name: 'q', required: true, type: String, description: 'Search term' })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Max results' })
    async search(
      @Query('q') term: string,
      @Query('limit') limitParam?: string,
    ): Promise<ResponseDto<Volunteer[]>> {
      // Convert string to number with validation
      let limit = 10; // default
      if (limitParam) {
        const parsed = parseInt(limitParam, 10);
        if (!isNaN(parsed) && parsed > 0 && parsed <= 100) {
          limit = parsed;
        }
      }
  
      const results = await this.volunteersService.search(term, limit);
      return ResponseDto.success('Search results retrieved successfully', results);
    }
  
    @Get('by-work-area/:workAreaId')
    @Roles(UserRole.ADMIN, UserRole.VOLUNTEER)
    @ApiOperation({ summary: 'Get volunteers by work area' })
    @ApiResponse({
      status: 200,
      description: 'Volunteers retrieved successfully',
      type: ResponseDto,
    })
    @ApiParam({ name: 'workAreaId', type: String, description: 'Work area ID' })
    async getByWorkArea(
      @Param('workAreaId', ParseUUIDPipe) workAreaId: string,
    ): Promise<ResponseDto<Volunteer[]>> {
      const volunteers = await this.volunteersService.getByWorkArea(workAreaId);
      return ResponseDto.success('Volunteers retrieved successfully', volunteers);
    }
  
    @Get('by-user/:userId')
    @Roles(UserRole.ADMIN, UserRole.VOLUNTEER)
    @ApiOperation({ summary: 'Get volunteer profile by user ID' })
    @ApiResponse({
      status: 200,
      description: 'Volunteer profile retrieved successfully',
      type: ResponseDto,
    })
    @ApiResponse({ status: 404, description: 'Volunteer profile not found' })
    @ApiParam({ name: 'userId', type: String, description: 'User ID' })
    async getByUserId(
      @Param('userId', ParseUUIDPipe) userId: string,
    ): Promise<ResponseDto<Volunteer | null>> {
      const volunteer = await this.volunteersService.findByUserId(userId);
      if (!volunteer) {
        return ResponseDto.success('No volunteer profile found for this user', null);
      }
      return ResponseDto.success('Volunteer profile retrieved successfully', volunteer);
    }
  
    @Get('by-nik/:nik')
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Get volunteer by NIK' })
    @ApiResponse({
      status: 200,
      description: 'Volunteer retrieved successfully',
      type: ResponseDto,
    })
    @ApiResponse({ status: 404, description: 'Volunteer not found' })
    @ApiParam({ name: 'nik', type: String, description: 'NIK (16 digits)' })
    async getByNik(
      @Param('nik') nik: string,
    ): Promise<ResponseDto<Volunteer | null>> {
      const volunteer = await this.volunteersService.findByNik(nik);
      if (!volunteer) {
        return ResponseDto.success('No volunteer found with this NIK', null);
      }
      return ResponseDto.success('Volunteer retrieved successfully', volunteer);
    }
  
    @Get(':id')
    @Roles(UserRole.ADMIN, UserRole.VOLUNTEER)
    @ApiOperation({ summary: 'Get volunteer by ID' })
    @ApiResponse({
      status: 200,
      description: 'Volunteer retrieved successfully',
      type: ResponseDto,
    })
    @ApiResponse({ status: 404, description: 'Volunteer not found' })
    @ApiParam({ name: 'id', type: String, description: 'Volunteer ID' })
    async findOne(
      @Param('id', ParseUUIDPipe) id: string,
    ): Promise<ResponseDto<Volunteer>> {
      const volunteer = await this.volunteersService.findOne(id);
      return ResponseDto.success('Volunteer retrieved successfully', volunteer);
    }
  
    @Patch(':id')
    @Roles(UserRole.ADMIN, UserRole.VOLUNTEER)
    @ApiOperation({ summary: 'Update volunteer profile' })
    @ApiResponse({
      status: 200,
      description: 'Volunteer updated successfully',
      type: ResponseDto,
    })
    @ApiResponse({ status: 400, description: 'Bad request - validation errors' })
    @ApiResponse({ status: 404, description: 'Volunteer not found' })
    @ApiResponse({ status: 409, description: 'Conflict - NIK already exists' })
    @ApiParam({ name: 'id', type: String, description: 'Volunteer ID' })
    async update(
      @Param('id', ParseUUIDPipe) id: string,
      @Body() updateVolunteerDto: UpdateVolunteerDto,
      @GetUser() user: User,
    ): Promise<ResponseDto<Volunteer>> {
      const volunteer = await this.volunteersService.update(id, updateVolunteerDto);
      return ResponseDto.success('Volunteer updated successfully', volunteer);
    }
  
    @Patch(':id/status')
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Update volunteer status' })
    @ApiResponse({
      status: 200,
      description: 'Volunteer status updated successfully',
      type: ResponseDto,
    })
    @ApiResponse({ status: 404, description: 'Volunteer not found' })
    @ApiParam({ name: 'id', type: String, description: 'Volunteer ID' })
    async updateStatus(
      @Param('id', ParseUUIDPipe) id: string,
      @Body() body: { status: VolunteerStatus; reason?: string },
      @GetUser() user: User,
    ): Promise<ResponseDto<Volunteer>> {
      const volunteer = await this.volunteersService.updateStatus(id, body.status, body.reason);
      return ResponseDto.success('Volunteer status updated successfully', volunteer);
    }
  
    @Delete(':id')
    @Roles(UserRole.ADMIN)
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete volunteer profile' })
    @ApiResponse({
      status: 204,
      description: 'Volunteer deleted successfully',
    })
    @ApiResponse({ status: 404, description: 'Volunteer not found' })
    @ApiParam({ name: 'id', type: String, description: 'Volunteer ID' })
    async remove(
      @Param('id', ParseUUIDPipe) id: string,
      @GetUser() user: User,
    ): Promise<void> {
      await this.volunteersService.remove(id);
    }
  }