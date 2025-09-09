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

export enum DocumentType {
    KTP = 'ktp',                    // Kartu Tanda Penduduk
    KK = 'kk',                      // Kartu Keluarga
    PHOTO = 'photo',                // Pas Foto
    IJAZAH = 'ijazah',             // Ijazah Terakhir
    SERTIFIKAT = 'sertifikat',     // Sertifikat Keahlian
    SURAT_SEHAT = 'surat_sehat',   // Surat Keterangan Sehat
    SKCK = 'skck',                 // Surat Keterangan Catatan Kepolisian
    CV = 'cv',                     // Curriculum Vitae
    SURAT_PERNYATAAN = 'surat_pernyataan', // Surat Pernyataan
    OTHER = 'other',               // Dokumen Lainnya
}

export enum DocumentStatus {
    UPLOADED = 'uploaded',
    PENDING_REVIEW = 'pending_review',
    APPROVED = 'approved',
    REJECTED = 'rejected',
    EXPIRED = 'expired',
}

@Entity('documents')
@Index(['volunteer_id'])
@Index(['document_type'])
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
    @Index()
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
    @Index()
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

    reject(reviewerId: string, reason: string): void {
        this.status = DocumentStatus.REJECTED;
        this.reviewedBy = reviewerId;
        this.reviewedAt = new Date();
        this.reviewNotes = reason;
    }

    getTypeLabel(): string {
        const labels = {
            [DocumentType.KTP]: 'Kartu Tanda Penduduk',
            [DocumentType.KK]: 'Kartu Keluarga',
            [DocumentType.PHOTO]: 'Pas Foto',
            [DocumentType.IJAZAH]: 'Ijazah Terakhir',
            [DocumentType.SERTIFIKAT]: 'Sertifikat Keahlian',
            [DocumentType.SURAT_SEHAT]: 'Surat Keterangan Sehat',
            [DocumentType.SKCK]: 'Surat Keterangan Catatan Kepolisian',
            [DocumentType.CV]: 'Curriculum Vitae',
            [DocumentType.SURAT_PERNYATAAN]: 'Surat Pernyataan',
            [DocumentType.OTHER]: 'Dokumen Lainnya',
        };
        return labels[this.documentType] || this.documentType;
    }

    getStatusLabel(): string {
        const labels = {
            [DocumentStatus.UPLOADED]: 'Diunggah',
            [DocumentStatus.PENDING_REVIEW]: 'Menunggu Review',
            [DocumentStatus.APPROVED]: 'Disetujui',
            [DocumentStatus.REJECTED]: 'Ditolak',
            [DocumentStatus.EXPIRED]: 'Kedaluwarsa',
        };
        return labels[this.status] || this.status;
    }

    getStatusColor(): string {
        const colors = {
            [DocumentStatus.UPLOADED]: 'blue',
            [DocumentStatus.PENDING_REVIEW]: 'yellow',
            [DocumentStatus.APPROVED]: 'green',
            [DocumentStatus.REJECTED]: 'red',
            [DocumentStatus.EXPIRED]: 'gray',
        };
        return colors[this.status] || 'gray';
    }

    getDaysUntilExpiry(): number | null {
        if (!this.expiryDate) {
          return null;
        }
        const today = new Date();
        const expiry = new Date(this.expiryDate);
        const diffTime = expiry.getTime() - today.getTime();
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