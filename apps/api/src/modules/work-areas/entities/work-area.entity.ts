import {
    Entity,
    Column,
    OneToMany,
    ManyToOne,
    JoinColumn,
    Index,
    In
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { BaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../../common/entities/user.entity';
import { Volunteer } from '../../volunteers/entities/volunteer.entity';

export enum WorkAreaType {
    VILLAGE = 'village',
    DISTRICT = 'district',
    CITY = 'city',
    PROVINCE = 'province',
    CUSTOM = 'custom',
}

export enum WorkAreaStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
    PLANNED = 'planned',
}

interface Coordinates {
    lat: number;
    lng: number;
}

interface Boundary {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: number[][][] | number[][][][];
}

@Entity('work_areas')
@Index(['name'])
@Index(['type', 'status'])
export class WorkArea extends BaseEntity {
    @ApiProperty({ description: 'Work area name' })
    @Column({ length: 150 })
    @Index()
    name: string;

    @ApiProperty({ description: 'Work area description' })
    @Column({ type: 'text', nullable: true })
    description?: string;

    @ApiProperty({ enum: WorkAreaType, description: 'Work area type' })
    @Column({ type: 'enum', enum: WorkAreaType, default: WorkAreaType.VILLAGE })
    type: WorkAreaType;

    @ApiProperty({ enum: WorkAreaStatus, description: 'Work area status' })
    @Column({ type: 'enum', enum: WorkAreaStatus, default: WorkAreaStatus.ACTIVE })
    @Index()
    status: WorkAreaStatus;

    @ApiProperty({ description: 'Area code (e.g., postal code, admin code)' })
    @Column({ name: 'area_code', length: 20, nullable: true })
    @Index()
    areaCode?: string;

    @ApiProperty({ description: 'Parent work area ID' })
    @Column({ name: 'parent_id', nullable: true })
    parentId?: string;

    @ApiProperty({ description: 'Coordinator user ID' })
    @Column({ name: 'coordinator_id', nullable: true })
    coordinatorId?: string;

    @ApiProperty({ description: 'Center point coordinates' })
    @Column({ type: 'jsonb', name: 'center_point' ,nullable: true })
    @Transform(({ value }) => value || null)
    centerPoint?: Coordinates;

    @ApiProperty({ description: 'GeoJSON boundary data' })
    @Column({ type: 'jsonb', nullable: true })
    @Transform(({ value }) => value || null)
    boundary?: Boundary;

    @ApiProperty({ description: 'Area in square kilometers' })
    @Column({
        type: 'decimal',
        precision: 10,
        scale: 4,
        name: 'area_km2',
        nullable: true
    })
    areaKm2?: number;

    @ApiProperty({ description: 'Population count' })
    @Column({ type: 'integer', nullable: true })
    population?: number;

    @ApiProperty({ description: 'Number of households' })
    @Column({ type: 'integer', name: 'household_count', nullable: true })
    householdCount?: number;

    @ApiProperty({ description: 'Target volunteer count' })
    @Column({
        type: 'integer',
        name: 'target_volunteer_count',
        default: 0
    })
    targetVolunteerCount: number;

    @ApiProperty({ description: 'Priority level (1-5, 5 being highest)' })
    @Column({ type: 'integer', default: 3 })
    priorityLevel: number;

    @ApiProperty({ description: 'Additional metadata' })
    @Column({ type: 'jsonb', nullable: true })
    @Transform(({ value }) => value || {})
    metadata?: Record<string, any>;

    @ApiProperty({ description: 'Address details' })
    @Column({ type: 'text', nullable: true })
    address?: string;

    @ApiProperty({ description: 'Contact information' })
    @Column({ type: 'jsonb', name: 'contact_info', nullable: true })
    @Transform(({ value }) => value || {})
    contactInfo?: {
        phone?: string;
        email?: string;
        website?: string;
        socialMedia?: Record<string, string>;
    };

    // Relations
    @ManyToOne(() => WorkArea, (workArea: WorkArea) => workArea.children, {
        nullable: true,
        onDelete: 'SET NULL'
    })
    @JoinColumn({ name: 'parent_id' })
    parent?: WorkArea;

    @OneToMany(() => WorkArea, (workArea: WorkArea) => workArea.parent)
    children?: WorkArea[];

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'coordinator_id' })
    coordinator?: User;

    @OneToMany(() => Volunteer, (volunteer: Volunteer) => volunteer.workArea)
    volunteers?: Volunteer[];
    static volunteers: any;

    // Computed properties
    get volunteerCount(): number {
        return this.volunteers?.length || 0;
    }

    get completionPercentage(): number {
        if (this.targetVolunteerCount === 0) {
          return 0;
        }
        return Math.min(100, (this.volunteerCount / this.targetVolunteerCount) * 100);
    }

    get isAtCapacity(): boolean {
        return this.volunteerCount >= this.targetVolunteerCount;
    }

    get hierarchyLevel(): number {
        let level = 0;
        let current = this.parent;
        while (current) {
            level++;
            current = current.parent;
        }
        return level;
    }

    // Helper methods
    isActive(): boolean {
        return this.status === WorkAreaStatus.ACTIVE;
    }

    canAssignVolunteers(): boolean {
        return this.isActive() && !this.isAtCapacity;
    }

    hasCoordinator(): boolean {
        return !!this.coordinatorId;
    }

    hasBoundary(): boolean {
        return !!this.boundary;
    }

    getFullHierarchyNames(): string {
        const names = [];
        let current: WorkArea | undefined = this;
        while (current) {
            names.unshift(current.name);
            current = current.parent;
        }
        return names.join(' → ');
    }

    isChildOf(wordArea: WorkArea): boolean {
        let current = this.parent;
        while (current) {
            if (current.id === wordArea.id) {
              return true;
            }
            current = current.parent;
        }
        return false;
    }

    getAllChildren(): WorkArea[] {
        const allChildren: WorkArea[] = [];

        const collectChildren = (area: WorkArea) => {
            if (area.children) {
                area.children.forEach((child) => {
                    allChildren.push(child);
                    collectChildren(child);
                });
            }
        };

        collectChildren(this);
        return allChildren;
    }

    updateVolunteerStats(): void {
        if (this.volunteers) {
            const activeVolunteers = this.volunteers.filter(v => v.isActive());
        }
    }
}