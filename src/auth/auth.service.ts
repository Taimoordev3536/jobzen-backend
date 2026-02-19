import { Injectable, BadRequestException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
        private mailService: MailService,
    ) { }

    async validateUser(email: string, pass: string): Promise<any> {
        const user = await this.usersService.findByEmail(email);
        if (user && (await bcrypt.compare(pass, user.passwordHash))) {
            const { passwordHash, ...result } = user;
            return result;
        }
        return null;
    }

    async login(user: any) {
        const payload = { email: user.email, sub: user.id, role: user.role };
        return {
            access_token: this.jwtService.sign(payload),
            user: user,
        };
    }

    async register(createUserDto: CreateUserDto) {
        const user = await this.usersService.create(createUserDto);
        const { passwordHash, ...result } = user;
        const payload = { email: user.email, sub: user.id, role: user.role };
        return {
            access_token: this.jwtService.sign(payload),
            user: result,
        };
    }

    async loginOAuth(user: any) {
        const payload = { email: user.email, sub: user.id, role: user.role };
        return {
            access_token: this.jwtService.sign(payload),
            user: user,
        };
    }

    async validateOAuthLogin(profile: any): Promise<any> {
        return this.usersService.findOrCreate(profile);
    }

    async forgotPassword(email: string) {
        const user = await this.usersService.findByEmail(email);
        if (!user) {
            // Don't reveal if user exists
            return { message: 'If a user with this email exists, a password reset link has been sent.' };
        }

        const resetToken = crypto.randomUUID();
        const resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour

        await this.usersService.updateResetToken(user.id, resetToken, resetPasswordExpires);
        await this.mailService.sendPasswordResetEmail(user.email, resetToken);

        return { message: 'If a user with this email exists, a password reset link has been sent.' };
    }

    async resetPassword(token: string, newPassword: string) {
        const user = await this.usersService.findByResetToken(token);
        if (!user || user.resetPasswordExpires < new Date()) {
            throw new BadRequestException('Invalid or expired password reset token');
        }

        const salt = await bcrypt.genSalt();
        const passwordHash = await bcrypt.hash(newPassword, salt);

        await this.usersService.updatePassword(user.id, passwordHash);

        return { message: 'Password has been reset successfully' };
    }
}
