import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthService } from './health.service';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('health')
@Controller('health')
export class HealthController {
    constructor(private readonly healthService: HealthService) {}

    @Get()
    @Public()
    @ApiOperation({ summary: 'Health check endpoint' })
    @ApiResponse({ status: 200, description: 'Service is healthy' })
    async check() {
        return this.healthService.getHealth();
    }

    @Get('detailed')
    @Public()
    @ApiOperation({ summary: 'Detailed health check with database status' })
    @ApiResponse({ status: 200, description: 'Detailed health information' })
    async detailedCheck() {
        return this.healthService.getDetailedHealth();
    }
}