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
  import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
  import { RolesGuard } from '../../auth/guards/roles.guard';
  import { Roles } from '../../auth/decorators/roles.decorator';
  import { GetUser } from '../../auth/decorators/get-user.decorator';
  import { UserRole, User } from '../../auth/entities/user.entity';
  import { ResponseDto } from '../../auth/dto/auth-response.dto';
  import { WorkAreasService } from './work-areas.service';
  import { CreateWorkAreaDto } from './dto/create-work-area.dto';
  import { UpdateWorkAreaDto } from './dto/update-work-area.dto';
  import { QueryWorkAreaDto, WorkAreaResponseDto } from './dto/query-work-area.dto';
  import { WorkArea } from './entities/work-area.entity';
import { parse } from 'path';
  
  @ApiTags('work-areas')
  @Controller('work-areas')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  export class WorkAreasController {
    constructor(private readonly workAreasService: WorkAreasService) {}
  
    @Post()
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Create a new work area' })
    @ApiResponse({
      status: 201,
      description: 'Work area created successfully',
      type: ResponseDto,
    })
    @ApiResponse({ status: 400, description: 'Bad request - validation errors' })
    @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
    @ApiResponse({ status: 409, description: 'Conflict - duplicate name in parent area' })
    async create(
      @Body() createWorkAreaDto: CreateWorkAreaDto,
      @GetUser() user: User,
    ): Promise<ResponseDto<WorkArea>> {
      const workArea = await this.workAreasService.create(createWorkAreaDto);
      return ResponseDto.success('Work area created successfully', workArea);
    }
  
    @Get()
    @Roles(UserRole.ADMIN, UserRole.VOLUNTEER)
    @ApiOperation({ summary: 'Get all work areas with filtering and pagination' })
    @ApiResponse({
      status: 200,
      description: 'Work areas retrieved successfully',
      type: ResponseDto,
    })
    @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
    @ApiQuery({ name: 'search', required: false, type: String, description: 'Search term' })
    @ApiQuery({ name: 'type', required: false, enum: ['village', 'district', 'city', 'province', 'custom'] })
    @ApiQuery({ name: 'status', required: false, enum: ['active', 'inactive', 'planned'] })
    @ApiQuery({ name: 'parentId', required: false, type: String, description: 'Parent area ID' })
    @ApiQuery({ name: 'coordinatorId', required: false, type: String, description: 'Coordinator ID' })
    @ApiQuery({ name: 'areaCode', required: false, type: String, description: 'Area code' })
    @ApiQuery({ name: 'sortBy', required: false, type: String, description: 'Sort field' })
    @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'] })
    @ApiQuery({ name: 'rootOnly', required: false, type: Boolean, description: 'Root areas only' })
    @ApiQuery({ name: 'includeChildrenCount', required: false, type: Boolean })
    @ApiQuery({ name: 'includeVolunteerCount', required: false, type: Boolean })
    async findAll(
      @Query() query: QueryWorkAreaDto,
    ): Promise<ResponseDto<{ data: WorkAreaResponseDto[]; meta: any }>> {
      const result = await this.workAreasService.findAll(query);
      return ResponseDto.success('Work areas retrieved successfully', result);
    }
  
    @Get('hierarchy')
    @Roles(UserRole.ADMIN, UserRole.VOLUNTEER)
    @ApiOperation({ summary: 'Get work area hierarchy (tree structure)' })
    @ApiResponse({
      status: 200,
      description: 'Work area hierarchy retrieved successfully',
      type: ResponseDto,
    })
    async getHierarchy(): Promise<ResponseDto<WorkArea[]>> {
      const hierarchy = await this.workAreasService.getHierarchy();
      return ResponseDto.success('Work area hierarchy retrieved successfully', hierarchy);
    }

    @Get('search')
    @Roles(UserRole.ADMIN, UserRole.VOLUNTEER)
    @ApiOperation({ summary: 'Search work areas by name or area code' })
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
    ): Promise<ResponseDto<WorkArea[]>> {
      let limit = 10;
      if (limitParam) {
        const parsed = parseInt(limitParam, 10);
        if (!isNaN(parsed) && parsed > 0 && parsed <= 100) {
          limit = parsed;
        }
      }

      const results = await this.workAreasService.search(term, limit);
      return ResponseDto.success('Search results retrieved successfully', results);
    }
    
  
    @Get(':id')
    @Roles(UserRole.ADMIN, UserRole.VOLUNTEER)
    @ApiOperation({ summary: 'Get work area by ID' })
    @ApiResponse({
      status: 200,
      description: 'Work area retrieved successfully',
      type: ResponseDto,
    })
    @ApiResponse({ status: 404, description: 'Work area not found' })
    @ApiParam({ name: 'id', type: String, description: 'Work area ID' })
    async findOne(
      @Param('id', ParseUUIDPipe) id: string,
    ): Promise<ResponseDto<WorkArea>> {
      const workArea = await this.workAreasService.findOne(id);
      return ResponseDto.success('Work area retrieved successfully', workArea);
    }
  
    @Get(':id/children')
    @Roles(UserRole.ADMIN, UserRole.VOLUNTEER)
    @ApiOperation({ summary: 'Get children of a work area' })
    @ApiResponse({
      status: 200,
      description: 'Child work areas retrieved successfully',
      type: ResponseDto,
    })
    @ApiResponse({ status: 404, description: 'Work area not found' })
    @ApiParam({ name: 'id', type: String, description: 'Parent work area ID' })
    async getChildren(
      @Param('id', ParseUUIDPipe) id: string,
    ): Promise<ResponseDto<WorkArea[]>> {
      const children = await this.workAreasService.getChildren(id);
      return ResponseDto.success('Child work areas retrieved successfully', children);
    }
  
    @Get(':id/ancestors')
    @Roles(UserRole.ADMIN, UserRole.VOLUNTEER)
    @ApiOperation({ summary: 'Get ancestors (breadcrumb) of a work area' })
    @ApiResponse({
      status: 200,
      description: 'Ancestors retrieved successfully',
      type: ResponseDto,
    })
    @ApiResponse({ status: 404, description: 'Work area not found' })
    @ApiParam({ name: 'id', type: String, description: 'Work area ID' })
    async getAncestors(
      @Param('id', ParseUUIDPipe) id: string,
    ): Promise<ResponseDto<WorkArea[]>> {
      const ancestors = await this.workAreasService.getAncestors(id);
      return ResponseDto.success('Ancestors retrieved successfully', ancestors);
    }
  
    @Patch(':id')
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Update work area' })
    @ApiResponse({
      status: 200,
      description: 'Work area updated successfully',
      type: ResponseDto,
    })
    @ApiResponse({ status: 400, description: 'Bad request - validation errors' })
    @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
    @ApiResponse({ status: 404, description: 'Work area not found' })
    @ApiResponse({ status: 409, description: 'Conflict - duplicate name or circular reference' })
    @ApiParam({ name: 'id', type: String, description: 'Work area ID' })
    async update(
      @Param('id', ParseUUIDPipe) id: string,
      @Body() updateWorkAreaDto: UpdateWorkAreaDto,
      @GetUser() user: User,
    ): Promise<ResponseDto<WorkArea>> {
      const workArea = await this.workAreasService.update(id, updateWorkAreaDto);
      return ResponseDto.success('Work area updated successfully', workArea);
    }
  
    @Post(':id/assign-coordinator')
    @Roles(UserRole.ADMIN)
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Assign coordinator to work area' })
    @ApiResponse({
      status: 200,
      description: 'Coordinator assigned successfully',
      type: ResponseDto,
    })
    @ApiResponse({ status: 400, description: 'Bad request - invalid coordinator' })
    @ApiResponse({ status: 404, description: 'Work area or coordinator not found' })
    @ApiParam({ name: 'id', type: String, description: 'Work area ID' })
    async assignCoordinator(
      @Param('id', ParseUUIDPipe) id: string,
      @Body('coordinatorId', ParseUUIDPipe) coordinatorId: string,
      @GetUser() user: User,
    ): Promise<ResponseDto<WorkArea>> {
      const workArea = await this.workAreasService.assignCoordinator(id, coordinatorId);
      return ResponseDto.success('Coordinator assigned successfully', workArea);
    }
  
    @Delete(':id/coordinator')
    @Roles(UserRole.ADMIN)
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Remove coordinator from work area' })
    @ApiResponse({
      status: 200,
      description: 'Coordinator removed successfully',
      type: ResponseDto,
    })
    @ApiResponse({ status: 404, description: 'Work area not found' })
    @ApiParam({ name: 'id', type: String, description: 'Work area ID' })
    async removeCoordinator(
      @Param('id', ParseUUIDPipe) id: string,
      @GetUser() user: User,
    ): Promise<ResponseDto<WorkArea>> {
      const workArea = await this.workAreasService.removeCoordinator(id);
      return ResponseDto.success('Coordinator removed successfully', workArea);
    }
  
    @Delete(':id')
    @Roles(UserRole.ADMIN)
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete work area' })
    @ApiResponse({
      status: 204,
      description: 'Work area deleted successfully',
    })
    @ApiResponse({ status: 404, description: 'Work area not found' })
    @ApiResponse({ status: 409, description: 'Conflict - work area has children or volunteers' })
    @ApiParam({ name: 'id', type: String, description: 'Work area ID' })
    async remove(
      @Param('id', ParseUUIDPipe) id: string,
      @GetUser() user: User,
    ): Promise<void> {
      await this.workAreasService.remove(id);
    }
  }