import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MediaAsset } from './entities/media-asset.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([MediaAsset]),
  ],
  controllers: [],
  providers: [],
  exports: [TypeOrmModule],
})
export class MediaModule {}