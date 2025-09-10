import {
    Entity,
    Column,
    OneToMany,
    ManyToOne,
    JoinColumn,
    Index
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { BaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../../auth/entities/user.entity';
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
    name: string;

    @ApiProperty({ description: 'Work area description' })
    @Column({ type: 'text', nullable: true })
    description?: string;

    @ApiProperty({ enum: WorkAreaType, description: 'Work area type' })
    @Column({ type: 'enum', enum: WorkAreaType, default: WorkAreaType.VILLAGE })
    type: WorkAreaType;

    @ApiProperty({ enum: WorkAreaStatus, description: 'Work area status' })
    @Column({ type: 'enum', enum: WorkAreaStatus, default: WorkAreaStatus.ACTIVE })
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
    @Column({ type: 'jsonb', name: 'center_point', nullable: true })
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
    @Column({ type: 'integer', name: 'priority_level', default: 3 })  // FIXED: Added name mapping
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
    @ManyToOne(() => WorkArea, (workArea) => workArea.children, {
        nullable: true,
        onDelete: 'SET NULL'
    })
    @JoinColumn({ name: 'parent_id' })
    parent?: WorkArea;

    @OneToMany(() => WorkArea, (workArea) => workArea.parent)
    children: WorkArea[];

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'coordinator_id' })
    coordinator?: User;

    // TODO: Add this relation when Volunteer entity is ready
    @OneToMany(() => Volunteer, (volunteer) => volunteer.workArea)
    volunteers: Volunteer[];

    // Computed properties
    get volunteerCount(): number {
        return this.volunteers?.length || 0;
    }

    get activeVolunteerCount(): number {
        return this.volunteers?.filter(v => v.isActive).length || 0;
    }

    get completionPercentage(): number {
        if (this.targetVolunteerCount === 0) {
          return 0;
        }
        return Math.min(100, (this.activeVolunteerCount / this.targetVolunteerCount) * 100);
    }

    get isAtCapacity(): boolean {
        return this.activeVolunteerCount >= this.targetVolunteerCount;
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

    isRoot(): boolean {
        return !this.parentId;
    }

    hasChildren(): boolean {
        return this.children && this.children.length > 0;
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

    isChildOf(workArea: WorkArea): boolean {
        let current = this.parent;
        while (current) {
            if (current.id === workArea.id) {
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
        // TODO: Implement when volunteer relation is ready
        if (this.volunteers) {
        const activeVolunteers = this.volunteers.filter(v => v.isActive);
        }
    }

    validateCoordinates(): boolean {
        if (!this.centerPoint) {
          return true;
        }
        
        const { lat, lng } = this.centerPoint;
        return (
            lat >= -90 && lat <= 90 &&
            lng >= -180 && lng <= 180
        );
    }

    calculateDistance(other: WorkArea): number | null {
        if (!this.centerPoint || !other.centerPoint) {
            return null;
        }

        const R = 6371; // Earth's radius in kilometers
        const lat1Rad = (this.centerPoint.lat * Math.PI) / 180;
        const lat2Rad = (other.centerPoint.lat * Math.PI) / 180;
        const deltaLatRad = ((other.centerPoint.lat - this.centerPoint.lat) * Math.PI) / 180;
        const deltaLngRad = ((other.centerPoint.lng - this.centerPoint.lng) * Math.PI) / 180;

        const a = 
            Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
            Math.cos(lat1Rad) * Math.cos(lat2Rad) *
            Math.sin(deltaLngRad / 2) * Math.sin(deltaLngRad / 2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        
        return R * c;
    }

    getPopulationDensity(): number | null {
        if (!this.population || !this.areaKm2) {
            return null;
        }
        return this.population / this.areaKm2;
    }
}