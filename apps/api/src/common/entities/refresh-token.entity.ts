import { Entity, Column, ManyToOne, JoinColumn , Index } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';

@Entity('refresh_tokens')
export class RefreshToken extends BaseEntity {
    @ApiProperty({ description: 'User ID' })
    @Column({ name: 'user_id' })
    userId: string;

    @ApiProperty({ description: 'Token hash' })
    @Column({ name: 'token_hash' })
    @Index()
    expiresAt: Date;

    @ApiProperty({ description: 'Revocation timestamp', required: false })
    @Column({ nullable: true, name: 'revoked_at' })
    revokedAt?: Date;

    @ApiProperty({ description: 'User agent', required: false })
    @Column({ type: 'text', nullable: true, name: 'user_agent' })
    userAgent?: string;

    @ApiProperty({ description: 'IP address', required: false })
    @Column({ type: 'inet', nullable: true, name: 'ip_address' })
    ipAddress?: string;

    @ManyToOne(() => User, user => user.refreshTokens, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    isvalid(): boolean {
        return !this.revokedAt && this.expiresAt > new Date();
    }

    isExpired(): boolean {
        return this.expiresAt <= new Date();
    }

    revoke(): void {
        this.revokedAt = new Date();
    }
}