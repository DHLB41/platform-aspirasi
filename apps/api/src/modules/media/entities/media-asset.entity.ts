import { 
    Entity, 
    Column, 
    ManyToOne, 
    JoinColumn, 
    Index 
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../../auth/entities/user.entity';

export enum MediaType {
    IMAGE = 'image',
    DOCUMENT = 'document',
    VIDEO = 'video',
    AUDIO = 'audio',
}

export enum MediaStatus {
    UPLOADED = 'uploaded',
    PROCESSING = 'processing',
    READY = 'ready',
    FAILED = 'failed',
}

@Entity('media_assets')
@Index(['owner_id'])
@Index(['mime_type'])
@Index(['status'])
export class MediaAsset extends BaseEntity {
    @ApiProperty({ description: 'Owner user ID' })
    @Column({ name: 'owner_id' })
    ownerId: string;

    @ApiProperty({ description: 'Original filename' })
    @Column({ length: 255, name: 'original_filename' })
    originalFilename: string;

    @ApiProperty({ description: 'S3 storage key' })
    @Column({ length: 500, name: 's3_key' })
    @Index()
    s3Key: string;

    @ApiProperty({ description: 'S3 bucket name' })
    @Column({ length: 100, name: 's3_bucket' })
    s3Bucket: string;

    @ApiProperty({ description: 'MIME type' })
    @Column({ length: 100, name: 'mime_type' })
    @Index()
    mimeType: string;

    @ApiProperty({ description: 'File size in bytes' })
    @Column({ type: 'bigint', name: 'file_size' })
    fileSize: number;

    @ApiProperty({ description: 'File checksum (SHA-256)' })
    @Column({ length: 64 })
    @Index()
    checksum: string;

    @ApiProperty({ enum: MediaType, description: 'Media type' })
    @Column({ type: 'enum', enum: MediaType, name: 'media_type' })
    mediaType: MediaType;

    @ApiProperty({ enum: MediaStatus, description: 'Processing status' })
    @Column({ type: 'enum', enum: MediaStatus, default: MediaStatus.UPLOADED })
    @Index()
    status: MediaStatus;

    @ApiProperty({ description: 'Public URL (if public)' })
    @Column({ length: 500, name: 'public_url', nullable: true })
    publicUrl?: string;

    @ApiProperty({ description: 'Thumbnail URL (for images/videos)' })
    @Column({ length: 500, name: 'thumbnail_url', nullable: true })
    thumbnailUrl?: string;

    @ApiProperty({ description: 'Image/video metadata' })
    @Column({ type: 'jsonb', nullable: true })
    metadata?: {
        width?: number;
        height?: number;
        duration?: number;
        format?: string;
        colorSpace?: string;
        exif?: Record<string, any>;
    };

    @ApiProperty({ description: 'Alt text for accessibility' })
    @Column({ length: 255, name: 'alt_text', nullable: true })
    altText?: string;

    @ApiProperty({ description: 'Is file public' })
    @Column({ type: 'boolean', name: 'is_public', default: false })
    isPublic: boolean;

    @ApiProperty({ description: 'Download count' })
    @Column({ type: 'integer', name: 'download_count', default: 0 })
    downloadCount: number;

    @ApiProperty({ description: 'Expiration date (for temporary files)' })
    @Column({ type: 'timestamp', name: 'expires_at', nullable: true })
    expiresAt?: Date;

    // Relations
    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'owner_id' })
    owner: User;

    // Helper methods
    isImage(): boolean {
        return this.mediaType === MediaType.IMAGE;
    }

    isDocument(): boolean {
        return this.mediaType === MediaType.DOCUMENT;
    }

    isReady(): boolean {
        return this.status === MediaStatus.READY;
    }

    isExpired(): boolean {
        return this.expiresAt ? new Date() > this.expiresAt : false;
    }

    getFileExtension(): string {
        return this.originalFilename.split('.').pop()?.toLowerCase() || '';
    }

    getFileSizeFormatted(): string {
        const units = ['B', 'KB', 'MB', 'GB'];
        let size = this.fileSize;
        let unitIndex = 0;

        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }

        return `${size.toFixed(1)} ${units[unitIndex]}`;
    }

    incrementDownloadCount(): void {
        this.downloadCount += 1;
    }
}