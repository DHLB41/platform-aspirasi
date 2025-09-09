import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class HealthService {
    constructor(
        @InjectDataSource()
        private readonly dataSource: DataSource,
    ) {}

    async getHealth() {
        return {
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: process.env.NODE_ENV || 'development',
        };
    }

    async getDetailedHealth() {
        const basicHealth = await this.getHealth();
        
        // Check database connection
        let databaseStatus = 'disconnected';
        try {
            await this.dataSource.query('SELECT 1');
            databaseStatus = 'connected';
        } catch (error) {
            databaseStatus = 'error';
        }

        return {
            ...basicHealth,
            services: {
                database: {
                    status: databaseStatus,
                    type: 'postgresql',
                },
                api: {
                    status: 'ok',
                    version: '1.0.0',
                },
            },
            memory: {
                used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
                total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
                external: Math.round(process.memoryUsage().external / 1024 / 1024),
            },
        };
    }
}