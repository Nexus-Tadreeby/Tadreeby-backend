import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('files')
export class File {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    fileName!: string;

    @Column()
    originalName!: string;

    @Column()
    mimeType!: string;

    @Column({ type: 'bigint' })
    size!: number;

    @Column()
    path!: string; 

    @Column({ nullable: true })
    url!: string; 

    @Column({ nullable: true })
    hash!: string;

    @Column({ default: 'pending' })
    status!: string; // pending, approved, rejected

    @Column({ nullable: true })
    uploadedBy!: number; // User ID

    @Column({ nullable: true })
    relatedEntity!: string; // student, task, etc.

    @Column({ nullable: true })
    relatedId!: string; // studentId, taskId, etc.

    @CreateDateColumn()
    createdAt!: Date;
}