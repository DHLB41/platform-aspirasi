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
import { 
    Gender, 
    RelationshipType, 
    FamilyMemberStatus 
} from '../../../common/types/volunteer.types';

@Entity('family_members')
@Index(['volunteerId'])
@Index(['relationship'])
@Index(['status'])
export class FamilyMember extends BaseEntity {
    @ApiProperty({ description: 'Volunteer ID' })
    @Column({ name: 'volunteer_id' })
    volunteerId: string;

    @ApiProperty({ description: 'Family member name' })
    @Column({ length: 100 })
    name: string;

    @ApiProperty({ description: 'NIK (Nomor Induk Kependudukan)' })
    @Column({ length: 16, nullable: true })
    nik?: string;

    @ApiProperty({ enum: RelationshipType, description: 'Relationship to volunteer' })
    @Column({ type: 'enum', enum: RelationshipType })
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

    @ApiProperty({ description: 'Address' })
    @Column({ type: 'text', nullable: true })
    address?: string;

    @ApiProperty({ enum: FamilyMemberStatus, description: 'Status' })
    @Column({ type: 'enum', enum: FamilyMemberStatus, default: FamilyMemberStatus.ACTIVE })
    status: FamilyMemberStatus;

    @ApiProperty({ description: 'Is financial dependent' })
    @Column({ type: 'boolean', name: 'is_dependent', default: false })
    isDependent: boolean;

    @ApiProperty({ description: 'Is emergency contact' })
    @Column({ type: 'boolean', name: 'is_emergency_contact', default: false })
    isEmergencyContact: boolean;

    @ApiProperty({ description: 'Additional notes' })
    @Column({ type: 'text', nullable: true })
    notes?: string;

    @ApiProperty({ description: 'Display order' })
    @Column({ type: 'integer', name: 'display_order', default: 0 })
    displayOrder: number;

    // Relations
    @ManyToOne(() => Volunteer, volunteer => volunteer.familyMembers, {
        onDelete: 'CASCADE'
    })
    @JoinColumn({ name: 'volunteer_id' })
    volunteer: Volunteer;

    // Helper properties
    get isChild(): boolean {
        return this.relationship === RelationshipType.CHILD;
    }

    get isSpouse(): boolean {
        return this.relationship === RelationshipType.SPOUSE;
    }

    get age(): number | null {
        if (!this.birthDate) return null;
        const today = new Date();
        const birthDate = new Date(this.birthDate);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        
        return age;
    }

    get isMinor(): boolean {
        const age = this.age;
        return age !== null && age < 17;
    }

    get isAdult(): boolean {
        const age = this.age;
        return age !== null && age >= 17;
    }

    hasCompleteContactInfo(): boolean {
        return !!(this.email || this.phone);
    }

    hasIncompleteContactInfo(): boolean {
        return !this.phone;
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
