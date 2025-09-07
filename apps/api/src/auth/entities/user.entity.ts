import { Entity, Column, OneToMany, Index } from 'typeorm';
import { Exclude } from 'class-transformer';
import { ApiProperty, ApiHideProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../common/entities/base.entity';
import { RefreshToken } from './refresh-token.entity';

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

export enum UserRole {
  ADMIN = 'admin',
  VOLUNTEER = 'volunteer',
  PUBLIC = 'public',
}

@Entity('users')
export class User extends BaseEntity {
  @ApiProperty({ description: 'User email address' })
  @Column({ unique: true })
  @Index()
  email: string;

  @ApiHideProperty()
  @Column({ nullable: true, name: 'password_hash' })
  @Exclude()
  passwordHash?: string;

  @ApiProperty({ description: 'Full name' })
  @Column()
  name: string;

  @ApiProperty({ description: 'Phone number', required: false })
  @Column({ nullable: true })
  @Index()
  phone?: string;

  @ApiProperty({ 
    enum: UserRole, 
    isArray: true, 
    description: 'User roles',
    default: [UserRole.VOLUNTEER]
  })
  @Column('text', { default: UserRole.VOLUNTEER })
  roles: string;

  @ApiProperty({ enum: UserStatus, description: 'Account status' })
  @Column({ 
    type: 'enum', 
    enum: UserStatus, 
    default: UserStatus.ACTIVE 
  })
  @Index()
  status: UserStatus;

  @ApiProperty({ description: 'Email verification timestamp', required: false })
  @Column({ nullable: true, name: 'email_verified_at' })
  emailVerifiedAt?: Date;

  @ApiProperty({ description: 'Phone verification timestamp', required: false })
  @Column({ nullable: true, name: 'phone_verified_at' })
  phoneVerifiedAt?: Date;

  @ApiProperty({ description: 'Last login timestamp', required: false })
  @Column({ nullable: true, name: 'last_login_at' })
  lastLoginAt?: Date;

  @OneToMany(() => RefreshToken, token => token.user, { cascade: true })
  refreshTokens: RefreshToken[];

  // Helper methods
  hasRole(role: UserRole): boolean {
    const rolesArray = this.roles.split(',');
    return rolesArray.includes(role);
  }

  isActive(): boolean {
    return this.status === UserStatus.ACTIVE;
  }

  isEmailVerified(): boolean {
    return !!this.emailVerifiedAt;
  }

  addRole(role: UserRole): void {
    const rolesArray = this.roles.split(',');
    if (!rolesArray.includes(role)) {
      this.roles = [...rolesArray, role].join(',');
    }
  }

  removeRole(role: UserRole): void {
    const rolesArray = this.roles.split(',');
    this.roles = rolesArray.filter(r => r !== role).join(',');
  }
}