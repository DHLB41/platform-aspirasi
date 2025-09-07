import { 
    PrimaryGeneratedColumn, 
    CreateDateColumn, 
    UpdateDateColumn 
  } from 'typeorm';
  import { ApiProperty } from '@nestjs/swagger';
  
  export abstract class BaseEntity {
    @ApiProperty({ description: 'Unique identifier' })
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @ApiProperty({ description: 'Creation timestamp' })
    @CreateDateColumn({ 
      type: 'timestamp',
      default: () => 'CURRENT_TIMESTAMP',
      name: 'created_at'
    })
    createdAt: Date;
  
    @ApiProperty({ description: 'Last update timestamp' })
    @UpdateDateColumn({ 
      type: 'timestamp',
      default: () => 'CURRENT_TIMESTAMP',
      onUpdate: 'CURRENT_TIMESTAMP',
      name: 'updated_at'
    })
    updatedAt: Date;
  }