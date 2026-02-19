import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';

export enum UserRole {
    ADMIN = 'admin',
    PARTNER = 'partner',
    EMPLOYER = 'employer',
    CLIENT = 'client',
    WORKER = 'worker',
    UNASSIGNED = 'unassigned',
}

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    email: string;

    @Column({ nullable: true })
    passwordHash: string;

    @Column({ nullable: true })
    provider: string;

    @Column({ nullable: true })
    providerId: string;

    @Column({ nullable: true })
    avatarUrl: string;

    @Column({ nullable: true })
    resetPasswordToken: string;

    @Column({ nullable: true })
    resetPasswordExpires: Date;

    @Column({
        type: 'enum',
        enum: UserRole,
        default: UserRole.CLIENT,
    })
    role: UserRole;

    @Column({ nullable: true })
    name: string;

    @Column({ nullable: true })
    phone: string;

    @Column({ nullable: true })
    firstName: string;

    @Column({ nullable: true })
    lastName: string;

    @Column({ default: true })
    isActive: boolean;

    @ManyToOne(() => User, (user) => user.managedUsers, { nullable: true })
    @JoinColumn({ name: 'createdById' })
    createdBy: User;

    @Column({ nullable: true })
    createdById: string;

    @OneToMany(() => User, (user) => user.createdBy)
    managedUsers: User[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
