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
import { User } from '../../../auth/entities/user.entity';
import { WorkArea } from '../../work-areas/entities/work-area.entity';
import { FamilyMember } from './family-member.entity';
import { Document } from './document.entity';
import { 
    Gender, 
    VolunteerStatus, 
    MaritalStatus 
} from '../../../common/types/volunteer.types';

@Entity('volunteers')
@Index(['nik'], { unique: true })
@Index(['userId'], { unique: true })
export class Volunteer extends BaseEntity {
    @ApiProperty({ description: 'User ID reference' })
    @Column({ name: 'user_id' })
    userId: string;

    @ApiProperty({ description: 'NIK' })
    @Column({ length: 16, unique: true })
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
    @Column({ type: 'text', nullable: true })
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
        name: 'document_completion_percentage',
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

    @ManyToOne(() => WorkArea, (workArea) => workArea.volunteers, {
        nullable: true,
        onDelete: 'SET NULL'
    })
    @JoinColumn({ name: 'work_area_id' })
    workArea?: WorkArea;

    @OneToMany(() => FamilyMember, (familyMember) => familyMember.volunteer, {
        cascade: true
    })
    familyMembers: FamilyMember[];

    @OneToMany(() => Document, (document) => document.volunteer, {
        cascade: true
    })
    documents: Document[];

    // Computed properties
    get age(): number {
        if (!this.birthDate) return 0;
        const today = new Date();
        const birth = new Date(this.birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        
        return age;
    }

    get fullName(): string {
        return this.user?.name || '';
    }

    get email(): string {
        return this.user?.email || '';
    }

    get phone(): string {
        return this.user?.phone || '';
    }

    get isActive(): boolean {
        return this.status === VolunteerStatus.ACTIVE;
    }

    get isAdult(): boolean {
        return this.age >= 17;
    }

    get hasCompleteProfile(): boolean {
        return !!(
            this.nik &&
            this.birthDate &&
            this.birthPlace &&
            this.address &&
            this.emergencyContactName &&
            this.emergencyContactPhone
        );
    }

    get hasRequiredDocuments(): boolean {
        const requiredTypes = ['ktp', 'photo'];
        const approvedDocs = this.documents?.filter(doc => doc.isApproved()) || [];
        
        return requiredTypes.every(type => 
            approvedDocs.some(doc => doc.documentType === type)
        );
    }

    // Helper methods
    isEligibleForActivation(): boolean {
        return this.hasCompleteProfile && this.hasRequiredDocuments;
    }

    activate(): void {
        if (this.isEligibleForActivation()) {
            this.status = VolunteerStatus.ACTIVE;
            this.lastActivityAt = new Date();
        }
    }

    suspend(reason?: string): void {
        this.status = VolunteerStatus.SUSPENDED;
    }

    resign(): void {
        this.status = VolunteerStatus.RESIGNED;
    }

    updateDocumentCompletion(): void {
        if (!this.documents || this.documents.length === 0) {
            this.documentCompletionPercentage = 0;
            return;
        }

        const approvedCount = this.documents.filter(doc => doc.isApproved()).length;
        this.documentCompletionPercentage = (approvedCount / this.documents.length) * 100;
    }

    updateLastActivity(): void {
        this.lastActivityAt = new Date();
    }

    getWorkAreaName(): string {
        return this.workArea?.name || 'Tidak ada area kerja';
    }

    getFamilyMemberCount(): number {
        return this.familyMembers?.length || 0;
    }

    getDocumentCount(): number {
        return this.documents?.length || 0;
    }

    getApprovedDocumentCount(): number {
        return this.documents?.filter(doc => doc.isApproved()).length || 0;
    }

    validateProfile(): string[] {
        const errors: string[] = [];

        if (!this.nik || this.nik.length !== 16) {
            errors.push('NIK harus 16 digit');
        }

        if (!this.birthDate) {
            errors.push('Tanggal lahir harus diisi');
        }

        if (!this.birthPlace || this.birthPlace.trim().length < 2) {
            errors.push('Tempat lahir harus diisi');
        }

        if (!this.address || this.address.trim().length < 10) {
            errors.push('Alamat lengkap harus diisi minimal 10 karakter');
        }

        if (this.emergencyContactPhone && !/^\+62[0-9]{8,12}$/.test(this.emergencyContactPhone)) {
            errors.push('Format nomor kontak darurat tidak valid (+62...)');
        }

        if (this.age < 17) {
            errors.push('Usia minimum relawan adalah 17 tahun');
        }

        return errors;
    }
}
