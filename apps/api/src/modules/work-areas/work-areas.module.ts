import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkArea } from './entities/work-area.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([WorkArea]),
  ],
  controllers: [],
  providers: [],
  exports: [TypeOrmModule],
})
export class WorkAreasModule {}