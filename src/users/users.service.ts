import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,
    ) { }

    async create(createUserDto: CreateUserDto): Promise<User> {
        const existingUser = await this.usersRepository.findOne({
            where: { email: createUserDto.email },
        });

        if (existingUser) {
            throw new ConflictException('Email already exists');
        }

        const salt = await bcrypt.genSalt();
        const passwordHash = await bcrypt.hash(createUserDto.password, salt);

        const user = this.usersRepository.create({
            ...createUserDto,
            passwordHash,
        });

        return this.usersRepository.save(user);
    }

    async findOne(id: string): Promise<User | null> {
        return this.usersRepository.findOne({ where: { id } });
    }

    async findByEmail(email: string): Promise<User | null> {
        return this.usersRepository.findOne({ where: { email } });
    }

    async findOrCreate(profile: any): Promise<User> {
        const { email, provider, providerId, firstName, lastName, picture } = profile;
        let user = await this.usersRepository.findOne({ where: { email } });

        if (user) {
            // Update provider info if missing or different
            if (!user.provider || user.provider !== provider) {
                user.provider = provider;
                user.providerId = providerId;
                user.avatarUrl = picture;
                await this.usersRepository.save(user);
            }
            return user;
        }

        user = this.usersRepository.create({
            email,
            firstName,
            lastName,
            name: `${firstName} ${lastName}`,
            provider,
            providerId,
            role: UserRole.UNASSIGNED,
            avatarUrl: picture,
            passwordHash: '', // No password for OAuth users
        });

        return this.usersRepository.save(user);
    }

    async updateRole(id: string, role: UserRole): Promise<User> {
        const user = await this.findOne(id);
        if (!user) {
            throw new Error('User not found');
        }
        user.role = role;
        return this.usersRepository.save(user);
    }
    async updateResetToken(id: string, token: string, expires: Date): Promise<void> {
        await this.usersRepository.update(id, {
            resetPasswordToken: token,
            resetPasswordExpires: expires,
        });
    }

    async findByResetToken(token: string): Promise<User | null> {
        return this.usersRepository.findOne({ where: { resetPasswordToken: token } });
    }

    async updatePassword(id: string, passwordHash: string): Promise<void> {
        await this.usersRepository.update(id, {
            passwordHash,
            resetPasswordToken: null as any,
            resetPasswordExpires: null as any,
        });
    }

    async updateProfile(id: string, data: Partial<Pick<User, 'name' | 'firstName' | 'lastName' | 'phone' | 'avatarUrl'>>): Promise<User> {
        await this.usersRepository.update(id, data);
        const updated = await this.findOne(id);
        if (!updated) throw new Error('User not found');
        return updated;
    }

    async createManagedUser(createUserDto: CreateUserDto, manager: User): Promise<User> {
        const existingUser = await this.usersRepository.findOne({
            where: { email: createUserDto.email },
        });

        if (existingUser) {
            throw new ConflictException('Email already exists');
        }

        const salt = await bcrypt.genSalt();
        const passwordHash = await bcrypt.hash(createUserDto.password, salt);

        const user = this.usersRepository.create({
            ...createUserDto,
            passwordHash,
            createdBy: manager,
            // Ensure strictly Worker or Client role if usually called by Employer
            role: createUserDto.role === UserRole.CLIENT ? UserRole.CLIENT : UserRole.WORKER,
        });

        return this.usersRepository.save(user);
    }

    async findManagedUsers(managerId: string, role?: UserRole): Promise<User[]> {
        return this.usersRepository.find({
            where: {
                createdBy: { id: managerId },
                ...(role && { role }),
            },
            order: { createdAt: 'DESC' },
        });
    }

    async deleteManagedUser(id: string, managerId: string): Promise<void> {
        const user = await this.usersRepository.findOne({
            where: { id, createdBy: { id: managerId } },
        });

        if (!user) {
            throw new Error('User not found or not authorized to delete');
        }

        await this.usersRepository.remove(user);
    }
}
