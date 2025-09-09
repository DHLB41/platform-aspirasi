#!/bin/bash

set -e

echo "🔧 Fixing Duplicate Export Issues"
echo "================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

cd apps/api

print_status "Creating shared types file..."

# Create common types file
mkdir -p src/common/types
cat > src/common/types/volunteer.types.ts << 'EOF'
export enum Gender {
    MALE = 'male',
    FEMALE = 'female',
}

export enum VolunteerStatus {
    PENDING = 'pending',
    ACTIVE = 'active',
    INACTIVE = 'inactive',
    SUSPENDED = 'suspended',
    RESIGNED = 'resigned',
}

export enum MaritalStatus {
    SINGLE = 'single',
    MARRIED = 'married',
    DIVORCED = 'divorced',
    WIDOWED = 'widowed',
}

export enum RelationshipType {
    SPOUSE = 'spouse',
    CHILD = 'child',
    PARENT = 'parent',
    SIBLING = 'sibling',
    GRANDPARENT = 'grandparent',
    GRANDCHILD = 'grandchild',
    UNCLE_AUNT = 'uncle_aunt',
    COUSIN = 'cousin',
    NEPHEW_NIECE = 'nephew_niece',
    OTHER = 'other',
}

export enum FamilyMemberStatus {
    ACTIVE = 'active',
    DECEASED = 'deceased',
    SEPARATED = 'separated',
}

export enum DocumentType {
    KTP = 'ktp',
    KK = 'kk',
    PHOTO = 'photo',
    IJAZAH = 'ijazah',
    SERTIFIKAT = 'sertifikat',
    SURAT_SEHAT = 'surat_sehat',
    SKCK = 'skck',
    CV = 'cv',
    SURAT_PERNYATAAN = 'surat_pernyataan',
    OTHER = 'other',
}

export enum DocumentStatus {
    UPLOADED = 'uploaded',
    PENDING_REVIEW = 'pending_review',
    APPROVED = 'approved',
    REJECTED = 'rejected',
    EXPIRED = 'expired',
}
EOF

print_success "Shared types file created!"

print_status "Updating Volunteer entity..."

cat > src/modules/volunteers/entities/volunteer.entity.ts << 'EOF'
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
EOF

print_status "Updating FamilyMember entity..."

cat > src/modules/volunteers/entities/family-member.entity.ts << 'EOF'
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
EOF

print_status "Updating Document entity..."

cat > src/modules/volunteers/entities/document.entity.ts << 'EOF'
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
import { MediaAsset } from '../../media/entities/media-asset.entity';
import { User } from '../../../auth/entities/user.entity';
import { 
    DocumentType, 
    DocumentStatus 
} from '../../../common/types/volunteer.types';

@Entity('documents')
@Index(['volunteerId'])
@Index(['documentType'])
@Index(['status'])
export class Document extends BaseEntity {
    @ApiProperty({ description: 'Volunteer ID' })
    @Column({ name: 'volunteer_id' })
    volunteerId: string;

    @ApiProperty({ description: 'Media asset ID' })
    @Column({ name: 'asset_id' })
    assetId: string;

    @ApiProperty({ enum: DocumentType, description: 'Document type' })
    @Column({ type: 'enum', enum: DocumentType, name: 'document_type' })
    documentType: DocumentType;

    @ApiProperty({ description: 'Document title/name' })
    @Column({ length: 200 })
    title: string;

    @ApiProperty({ description: 'Document description' })
    @Column({ type: 'text', nullable: true })
    description?: string;

    @ApiProperty({ enum: DocumentStatus, description: 'Review status' })
    @Column({ 
        type: 'enum', 
        enum: DocumentStatus, 
        default: DocumentStatus.UPLOADED 
    })
    status: DocumentStatus;

    @ApiProperty({ description: 'Document number (KTP number, etc.)' })
    @Column({ length: 50, name: 'document_number', nullable: true })
    documentNumber?: string;

    @ApiProperty({ description: 'Issue date' })
    @Column({ type: 'date', name: 'issue_date', nullable: true })
    issueDate?: Date;

    @ApiProperty({ description: 'Expiry date' })
    @Column({ type: 'date', name: 'expiry_date', nullable: true })
    expiryDate?: Date;

    @ApiProperty({ description: 'Issuing authority' })
    @Column({ length: 150, name: 'issuing_authority', nullable: true })
    issuingAuthority?: string;

    @ApiProperty({ description: 'Reviewer user ID' })
    @Column({ name: 'reviewed_by', nullable: true })
    reviewedBy?: string;

    @ApiProperty({ description: 'Review timestamp' })
    @Column({ type: 'timestamp', name: 'reviewed_at', nullable: true })
    reviewedAt?: Date;

    @ApiProperty({ description: 'Review notes' })
    @Column({ type: 'text', name: 'review_notes', nullable: true })
    reviewNotes?: string;

    @ApiProperty({ description: 'Is required document' })
    @Column({ type: 'boolean', name: 'is_required', default: false })
    isRequired: boolean;

    @ApiProperty({ description: 'Display order' })
    @Column({ type: 'integer', name: 'display_order', default: 0 })
    displayOrder: number;

    @ApiProperty({ description: 'Auto-extracted data from document' })
    @Column({ type: 'jsonb', name: 'extracted_data', nullable: true })
    extractedData?: Record<string, any>;

    // Relations
    @ManyToOne(() => Volunteer, volunteer => volunteer.documents, {
        onDelete: 'CASCADE'
    })
    @JoinColumn({ name: 'volunteer_id' })
    volunteer: Volunteer;

    @ManyToOne(() => MediaAsset, { eager: true, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'asset_id' })
    asset: MediaAsset;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'reviewed_by' })
    reviewer?: User;

    // Helper methods
    isApproved(): boolean {
        return this.status === DocumentStatus.APPROVED;
    }

    isRejected(): boolean {
        return this.status === DocumentStatus.REJECTED;
    }

    isPendingReview(): boolean {
        return this.status === DocumentStatus.PENDING_REVIEW;
    }

    isExpired(): boolean {
        if (!this.expiryDate) {
          return false;
        }
        return new Date() > this.expiryDate;
    }

    needsReview(): boolean {
        return this.status === DocumentStatus.UPLOADED;
    }

    canBeApproved(): boolean {
        return [DocumentStatus.UPLOADED, DocumentStatus.PENDING_REVIEW, DocumentStatus.REJECTED]
            .includes(this.status);
    }

    approve(reviewerId: string, notes?: string): void {
        this.status = DocumentStatus.APPROVED;
        this.reviewedBy = reviewerId;
        this.reviewedAt = new Date();
        this.reviewNotes = notes;
    }

    reject(reviewerId: string, notes: string): void {
        this.status = DocumentStatus.REJECTED;
        this.reviewedBy = reviewerId;
        this.reviewedAt = new Date();
        this.reviewNotes = notes;
    }

    getDaysUntilExpiry(): number | null {
        if (!this.expiryDate) {
            return null;
        }
        const now = new Date();
        const diffTime = this.expiryDate.getTime() - now.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    willExpireSoon(days: number = 30): boolean {
        const daysUntilExpiry = this.getDaysUntilExpiry();
        return daysUntilExpiry !== null && daysUntilExpiry <= days && daysUntilExpiry > 0;
    }

    validateDocumentData(): string[] {
        const errors: string[] = [];

        if (!this.title || this.title.trim().length < 3) {
            errors.push('Judul dokumen harus diisi minimal 3 karakter');
        }

        if (this.expiryDate && this.issueDate && this.expiryDate <= this.issueDate) {
            errors.push('Tanggal kedaluwarsa harus setelah tanggal terbit');
        }

        if (this.documentType === DocumentType.KTP && this.documentNumber && this.documentNumber.length !== 16) {
              errors.push('Nomor KTP harus 16 digit');
        }

        if (this.documentType === DocumentType.KK && this.documentNumber && this.documentNumber.length !== 16) {
              errors.push('Nomor KK harus 16 digit');
        }

        return errors;
    }
}
EOF

print_status "Updating volunteers module index..."

cat > src/modules/volunteers/index.ts << 'EOF'
// Export entities without duplicating enums
export { Volunteer } from './entities/volunteer.entity';
export { FamilyMember } from './entities/family-member.entity';
export { Document } from './entities/document.entity';

// Export shared types from common location
export * from '../../common/types/volunteer.types';
EOF

print_success "All entities updated with shared types!"

print_status "Testing TypeScript compilation..."
if npm run build > /dev/null 2>&1; then
    print_success "✅ All duplicate export issues resolved!"
    print_success "✅ TypeScript compilation successful!"
    
    print_status "Now you can run the migration:"
    echo "  npm run migration:run"
    echo "  npm run seed"
    echo "  npm run start:dev"
    
else
    print_error "❌ Still have compilation issues. Running build to show errors:"
    npm run build
    exit 1
fi