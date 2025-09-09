import {
    Entity,
    Column,
    OneToOne,
    OneToMany,
    ManyToOne,
    JoinColumn,
    Index
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { BaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../../common/entities/user.entity';
import { WorkArea } from '../../work-areas/entities/work-area.entity';
import { FamilyMember } from './family-member.entity';
import { Document } from './document.entity';

export enum VolunteerStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
    SUSPENDED = 'suspended',
    RESIGNED = 'resigned',
}

export enum Gender {
    MALE = 'male',
    FEMALE = 'female',
}

export enum MaritalStatus {
    SINGLE = 'single',
    MARRIED = 'married',
    DIVORCED = 'divorced',
    WIDOWED = 'widowed',
}

@Entity('volunteers')
@Index(['nik'], { unique: true })
@Index(['user_id'], { unique: true })
export class Volunteer extends BaseEntity {
    @ApiProperty({ description: 'User ID reference' })
    @Column({ name: 'user_id' })
    userId: string;

    @ApiProperty({ description: 'NIK' })
    @Column({ length: 16, unique: true })
    @Index()
    nik: string;

    @ApiProperty({ description: 'Birth date' })
    @Column({ name: 'birth_date', type: 'date' })
    birthDate: Date;

    @ApiProperty({ description: 'Birth place' })
    @Column({ name: 'birth_place', length: 100 })
    birthPlace: string;

    @ApiProperty({ enum: Gender, description: 'Gender' })
    @Column({ type: 'enum', enum: Gender })
    gender: Gender;

    @ApiProperty({ enum: MaritalStatus, description: 'Marital status' })
    @Column({
        type: 'enum',
        enum: MaritalStatus,
        name: 'marital_status',
        default: MaritalStatus.SINGLE
    })
    maritalStatus: MaritalStatus;

    @ApiProperty({ description: 'Complete Address' })
    @Column({ type: 'text' })
    address: string;

    @ApiProperty({ description: 'RT number' })
    @Column({ length: 3, nullable: true })
    rt?: string;

    @ApiProperty({ description: 'RW number' })
    @Column({ length: 3, nullable: true })
    rw?: string;

    @ApiProperty({ description: 'Village/Kelurahan' })
    @Column({ length: 100, nullable: true })
    village?: string;

    @ApiProperty({ description: 'District/Kecamatan' })
    @Column({ length: 100, nullable: true })
    district?: string;

    @ApiProperty({ description: 'City/Kabupaten' })
    @Column({ length: 100, nullable: true })
    city?: string;

    @ApiProperty({ description: 'Province' })
    @Column({ length: 100, nullable: true })
    province?: string;

    @ApiProperty({ description: 'Postal Code' })
    @Column({ name: 'postal_code', length: 5, nullable: true })
    postalCode?: string;

    @ApiProperty({ description: 'Education level' })
    @Column({ length: 50, nullable: true })
    education?: string;

    @ApiProperty({ description: 'Occupation' })
    @Column({ length: 100, nullable: true })
    occupation?: string;

    @ApiProperty({ description: 'Emergency contact name' })
    @Column({ name: 'emergency_contact_name', length: 100, nullable: true })
    emergencyContactName?: string;

    @ApiProperty({ description: 'Emergency contact phone' })
    @Column({ name: 'emergency_contact_phone', length: 20, nullable: true })
    emergencyContactPhone?: string;

    @ApiProperty({ description: 'Skills array' })
    @Column({ type: 'jsonb', nullable: true })
    @Transform(({ value }) => value || [])
    skills?: string[];

    @ApiProperty({ description: 'Bio/description' })
    @Column({ type: 'text', nullable: true})
    bio?: string;

    @ApiProperty({ description: 'Join date as volunteer' })
    @Column({ name: 'join_date', type: 'date', default: () => 'CURRENT_DATE' })
    joinDate: Date;

    @ApiProperty({ enum: VolunteerStatus, description: 'Volunteer status' })
    @Column({
        type: 'enum',
        enum: VolunteerStatus,
        default: VolunteerStatus.ACTIVE
    })
    @Index()
    status: VolunteerStatus;

    @ApiProperty({ description: 'Work area ID' })
    @Column({ name: 'work_area_id', nullable: true })
    workAreaId?: string;

    @ApiProperty({ description: 'Profile photo URL' })
    @Column({ name: 'profile_photo_url', nullable: true })
    profilePhotoUrl?: string;

    @ApiProperty({ description: 'Document completion percentage' })
    @Column({
        type: 'decimal',
        precision: 5,
        scale: 2,
        name: 'docume/nt_completion_percentage',
        default: 0.00
    })
    documentCompletionPercentage: number;

    @ApiProperty({ description: 'Last activity timestamp' })
    @Column({ name: 'last_activity_at', type: 'timestamp', nullable: true })
    lastActivityAt?: Date;

    // Relations
    @OneToOne(() => User, { eager: true })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @ManyToOne(() => WorkArea, (workArea: WorkArea) => WorkArea.volunteers, {
        nullable: true,
        onDelete: 'SET NULL'
     })
    @JoinColumn({ name: 'work_area_id' })
    workArea?: WorkArea;

    @OneToMany(() => FamilyMember, (familyMember: FamilyMember) => familyMember.volunteer, {
        cascade: true,
        onDelete: 'CASCADE'
    })
    familyMembers: FamilyMember[];

    @OneToMany(() => Document, (document: Document) => document.volunteer, {
        cascade: true,
        onDelete: 'CASCADE'
    })
    documents: Document[];

    // Computed property
    get age(): number {
        if (!this.birthDate) {
          return 0;
        }
        const today = new Date();
        const birth = new Date(this.birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }

        return age;
    }

    get fullAddress(): string {
        const parts = [
            this.address,
            this.rt && this.rw ? `RT ${this.rt}/RW ${this.rw}` : null,
            this.village,
            this.district,
            this.city,
            this.province,
            this.postalCode
        ].filter(Boolean);

        return parts.join(', ');
    }

    // Helper methods
    isActive(): boolean {
        return this.status === VolunteerStatus.ACTIVE;
    }

    hasCompletedProfile(): boolean {
        return !!(
            this.nik &&
            this.birthDate &&
            this.birthPlace &&
            this.gender &&
            this.address &&
            this.emergencyContactName &&
            this.emergencyContactPhone
        );
    }

    updateDocumentCompletion(): void {
        if (!this.documents || this.documents.length === 0) {
            this.documentCompletionPercentage = 0;
            return;
        }

        const requiredDocs = ['ktp', 'kk', 'photo'];
        const uploadedDocs = this.documents
            .filter(doc => doc.isApproved() && requiredDocs.includes(doc.documentType))
            .map(doc => doc.documentType);

        const completion = (uploadedDocs.length / requiredDocs.length) * 100;
        this.documentCompletionPercentage = Math.round(completion * 100) / 100;
    }

    updateLastActivity(): void {
        this.lastActivityAt = new Date();
    }
}