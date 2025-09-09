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
