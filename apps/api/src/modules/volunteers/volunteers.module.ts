import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Volunteer } from './entities/volunteer.entity';
import { FamilyMember } from './entities/family-member.entity';
import { Document } from './entities/document.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Volunteer,
      FamilyMember,
      Document,
    ]),
  ],
  controllers: [],
  providers: [],
  exports: [TypeOrmModule],
})
export class VolunteersModule {}