
import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
    private transporter;
    private readonly logger = new Logger(MailService.name);

    constructor(private configService: ConfigService) {
        this.transporter = nodemailer.createTransport({
            host: this.configService.get<string>('MAIL_HOST'),
            port: this.configService.get<number>('MAIL_PORT'),
            secure: false, // true for 465, false for other ports
            auth: {
                user: this.configService.get<string>('MAIL_USER'),
                pass: this.configService.get<string>('MAIL_PASSWORD'),
            },
        });
    }

    async sendPasswordResetEmail(to: string, token: string) {
        const resetLink = `http://localhost:3000/reset-password?token=${token}`;

        try {
            await this.transporter.sendMail({
                from: `"Jobzen Support" <${this.configService.get<string>('MAIL_USER')}>`, // Use auth user to avoid blocking
                to,
                subject: 'Password Reset Request',
                html: `
            <p>You requested a password reset</p>
            <p>Click this link to reset your password:</p>
            <a href="${resetLink}">${resetLink}</a>
          `,
            });
            this.logger.log(`Password reset email sent to ${to}`);
        } catch (error) {
            this.logger.error(`Failed to send password reset email to ${to}`, error);
            throw error;
        }
    }
}
