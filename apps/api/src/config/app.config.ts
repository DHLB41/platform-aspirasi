import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  name: process.env.APP_NAME || 'Platform Aspirasi',
  url: process.env.APP_URL || 'http://localhost:3000',
  apiUrl: process.env.API_URL || 'http://localhost:3001',
  apiPrefix: process.env.API_PREFIX || 'api/v1',
  port: parseInt(process.env.PORT) || 3001,
  
  environment: process.env.NODE_ENV || 'development',
  logLevel: process.env.LOG_LEVEL || 'info',
  
  // Security
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
  
  // External services
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
}));