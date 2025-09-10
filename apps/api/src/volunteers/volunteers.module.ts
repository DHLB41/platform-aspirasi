import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VolunteersService } from '../volunteers/volunteers.service';
import { VolunteersController } from './volunteers.controller';
import { Volunteer } from '../modules/volunteers/entities/volunteer.entity';
import { FamilyMember } from '../modules/volunteers/entities/family-member.entity';
import { Document } from '../modules/volunteers/entities/document.entity';
import { User } from '../auth/entities/user.entity';
import { WorkArea } from '../modules/work-areas/entities/work-area.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Volunteer,
      FamilyMember,
      Document,
      User,
      WorkArea,
    ]),
  ],
  controllers: [VolunteersController],
  providers: [VolunteersService],
  exports: [VolunteersService],
})
export class VolunteersModule {}