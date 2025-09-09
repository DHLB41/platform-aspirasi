import { 
    Entity, 
    Column, 
    ManyToOne, 
    JoinColumn, 
    Index 
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Volunteer } from './volunteer.entity';

export enum Gender {
    MALE = 'male',
    FEMALE = 'female',
}

export enum RelationshipType {
    SPOUSE = 'spouse',              // Suami/Istri
    CHILD = 'child',                // Anak
    PARENT = 'parent',              // Orang Tua
    SIBLING = 'sibling',            // Saudara
    GRANDPARENT = 'grandparent',    // Kakek/Nenek
    GRANDCHILD = 'grandchild',      // Cucu
    UNCLE_AUNT = 'uncle_aunt',      // Paman/Bibi
    COUSIN = 'cousin',              // Sepupu
    NEPHEW_NIECE = 'nephew_niece',  // Keponakan
    OTHER = 'other',                // Lainnya
}

export enum FamilyMemberStatus {
    ACTIVE = 'active',
    DECEASED = 'deceased',
    SEPARATED = 'separated',
}

@Entity('family_members')
@Index(['volunteerId'])
@Index(['relationship'])
export class FamilyMember extends BaseEntity {
    @ApiProperty({ description: 'Volunteer ID' })
    @Column({ name: 'volunteer_id' })
    volunteerId: string;

    @ApiProperty({ description: 'Full name' })
    @Column({ length: 100 })
    name: string;

    @ApiProperty({ description: 'NIK (if applicable)' })
    @Column({ length: 16, nullable: true })
    @Index()
    nik?: string;

    @ApiProperty({ enum: RelationshipType, description: 'Relationship to volunteer' })
    @Column({ type: 'enum', enum: RelationshipType })
    @Index()
    relationship: RelationshipType;

    @ApiProperty({ enum: Gender, description: 'Gender' })
    @Column({ type: 'enum', enum: Gender })
    gender: Gender;

    @ApiProperty({ description: 'Birth date' })
    @Column({ type: 'date', name: 'birth_date', nullable: true })
    birthDate?: Date;

    @ApiProperty({ description: 'Birth place' })
    @Column({ length: 100, name: 'birth_place', nullable: true })
    birthPlace?: string;

    @ApiProperty({ description: 'Phone number' })
    @Column({ length: 20, nullable: true })
    phone?: string;

    @ApiProperty({ description: 'Email address' })
    @Column({ length: 100, nullable: true })
    email?: string;

    @ApiProperty({ description: 'Occupation' })
    @Column({ length: 100, nullable: true })
    occupation?: string;

    @ApiProperty({ description: 'Education level' })
    @Column({ length: 50, nullable: true })
    education?: string;

    @ApiProperty({ description: 'Address (if different from volunteer)' })
    @Column({ type: 'text', nullable: true })
    address?: string;

    @ApiProperty({ enum: FamilyMemberStatus, description: 'Status' })
    @Column({ 
        type: 'enum', 
        enum: FamilyMemberStatus, 
        default: FamilyMemberStatus.ACTIVE 
    })
    status: FamilyMemberStatus;

    @ApiProperty({ description: 'Is dependent (for KTA purposes)' })
    @Column({ type: 'boolean', name: 'is_dependent', default: false })
    isDependent: boolean;

    @ApiProperty({ description: 'Is emergency contact' })
    @Column({ type: 'boolean', name: 'is_emergency_contact', default: false })
    isEmergencyContact: boolean;

    @ApiProperty({ description: 'Additional notes' })
    @Column({ type: 'text', nullable: true })
    notes?: string;

    @ApiProperty({ description: 'Order for display/KTA' })
    @Column({ type: 'integer', name: 'display_order', default: 0 })
    displayOrder: number;

    // Relations
    @ManyToOne(() => Volunteer, volunteer => volunteer.familyMembers, {
        onDelete: 'CASCADE'
    })
    @JoinColumn({ name: 'volunteer_id' })
    volunteer: Volunteer;

    // Computed properties
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

    get isMinor(): boolean {
        return this.age < 17; // Indonesian legal age
    }

    get isChild(): boolean {
        return this.relationship === RelationshipType.CHILD;
    }

    get isSpouse(): boolean {
        return this.relationship === RelationshipType.SPOUSE;
    }

    // Helper methods
    isActive(): boolean {
        return this.status === FamilyMemberStatus.ACTIVE;
    }

    isEligibleForKTA(): boolean {
        return this.isActive() && (this.isSpouse || (this.isChild && this.isMinor));
    }

    canBeEmergencyContact(): boolean {
        return this.isActive() && !this.isMinor && !!this.phone;
    }

    getRelationshipLabel(): string {
        const labels = {
            [RelationshipType.SPOUSE]: 'Suami/Istri',
            [RelationshipType.CHILD]: 'Anak',
            [RelationshipType.PARENT]: 'Orang Tua',
            [RelationshipType.SIBLING]: 'Saudara',
            [RelationshipType.GRANDPARENT]: 'Kakek/Nenek',
            [RelationshipType.GRANDCHILD]: 'Cucu',
            [RelationshipType.UNCLE_AUNT]: 'Paman/Bibi',
            [RelationshipType.COUSIN]: 'Sepupu',
            [RelationshipType.NEPHEW_NIECE]: 'Keponakan',
            [RelationshipType.OTHER]: 'Lainnya',
        };
        return labels[this.relationship] || this.relationship;
    }

    getGenderLabel(): string {
        return this.gender === Gender.MALE ? 'Laki-laki' : 'Perempuan';
    }

    getStatusLabel(): string {
        const labels = {
            [FamilyMemberStatus.ACTIVE]: 'Aktif',
            [FamilyMemberStatus.DECEASED]: 'Meninggal',
            [FamilyMemberStatus.SEPARATED]: 'Terpisah',
        };
        return labels[this.status] || this.status;
    }

    updateDependentStatus(): void {
        // Auto-update dependent status based on relationship and age
        if (this.isChild && this.isMinor) {
            this.isDependent = true;
        } else if (this.relationship === RelationshipType.SPOUSE && this.occupation === 'Ibu Rumah Tangga') {
            this.isDependent = true;
        } else {
            this.isDependent = false;
        }
    }

    validateData(): string[] {
        const errors: string[] = [];

        if (!this.name || this.name.trim().length < 2) {
            errors.push('Nama harus diisi minimal 2 karakter');
        }

        if (this.nik && this.nik.length !== 16) {
            errors.push('NIK harus 16 digit');
        }

        if (this.phone && !/^\+62[0-9]{8,12}$/.test(this.phone)) {
            errors.push('Format nomor telepon tidak valid (+62...)');
        }

        if (this.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email)) {
            errors.push('Format email tidak valid');
        }

        if (this.birthDate && this.birthDate > new Date()) {
            errors.push('Tanggal lahir tidak boleh di masa depan');
        }

        if (this.isEmergencyContact && !this.phone) {
            errors.push('Kontak darurat harus memiliki nomor telepon');
        }

        return errors;
    }
}