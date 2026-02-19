import { Controller, Get, Patch, Post, Body, Query, UseGuards, Request, UnauthorizedException, Delete, Param } from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from '@nestjs/passport';
import { User, UserRole } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @UseGuards(AuthGuard('jwt'))
    @Get('me')
    async getMe(@Request() req) {
        const user = await this.usersService.findOne(req.user.userId);
        if (!user) return null;
        const { passwordHash, resetPasswordToken, resetPasswordExpires, ...safe } = user;
        return safe;
    }

    @UseGuards(AuthGuard('jwt'))
    @Patch('complete-profile')
    async completeProfile(@Request() req, @Body() body: { role: UserRole }) {
        return this.usersService.updateRole(req.user.userId, body.role);
    }

    @UseGuards(AuthGuard('jwt'))
    @Patch('profile')
    async updateProfile(
        @Request() req,
        @Body() body: {
            name?: string;
            firstName?: string;
            lastName?: string;
            phone?: string;
            avatarUrl?: string;
        },
    ) {
        const updated = await this.usersService.updateProfile(req.user.userId, body);
        const { passwordHash, resetPasswordToken, resetPasswordExpires, ...safe } = updated;
        return safe;
    }

    @UseGuards(AuthGuard('jwt'))
    @Post('managed')
    async createManagedUser(@Request() req, @Body() body: CreateUserDto) {
        if (req.user.role !== UserRole.EMPLOYER) {
            throw new UnauthorizedException('Only employers can add managed users');
        }
        // Create a partial user object with just the ID for the relation
        const manager = { id: req.user.userId } as User;
        const created = await this.usersService.createManagedUser(body, manager);
        const { passwordHash, resetPasswordToken, resetPasswordExpires, ...safe } = created;
        return safe;
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('managed')
    async getManagedUsers(@Request() req, @Query('role') role?: UserRole) {
        if (req.user.role !== UserRole.EMPLOYER) {
            throw new UnauthorizedException('Only employers can view managed users');
        }
        const users = await this.usersService.findManagedUsers(req.user.userId, role);
        return users.map(user => {
            const { passwordHash, resetPasswordToken, resetPasswordExpires, ...safe } = user;
            return safe;
        });
    }

    @UseGuards(AuthGuard('jwt'))
    @Delete('managed/:id')
    async deleteManagedUser(@Request() req, @Param('id') id: string) {
        if (req.user.role !== UserRole.EMPLOYER) {
            throw new UnauthorizedException('Only employers can delete managed users');
        }
        await this.usersService.deleteManagedUser(id, req.user.userId);
        return { message: 'User deleted successfully' };
    }
}
