import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkAreasService } from './work-areas.service';
import { WorkAreasController } from './work-areas.controller';
import { WorkArea } from './entities/work-area.entity';
import { User } from '../../auth/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([WorkArea, User])],
  controllers: [WorkAreasController],
  providers: [WorkAreasService],
  exports: [WorkAreasService],
})
export class WorkAreasModule {}
