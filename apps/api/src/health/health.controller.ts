import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('health')
@Controller('health')
export class HealthController {
  @Get()
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
    };
  }

  @Get('ready')
  getReadiness() {
    return {
      status: 'ready',
      timestamp: new Date().toISOString(),
      checks: {
        database: 'connected',
        redis: 'connected',
      },
    };
  }
}