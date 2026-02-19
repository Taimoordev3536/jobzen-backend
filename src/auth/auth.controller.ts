import { Controller, Request, Post, UseGuards, Body, Get, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { CreateUserDto } from '../users/dto/create-user.dto';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @UseGuards(AuthGuard('local'))
    @Post('login')
    async login(@Request() req) {
        return this.authService.login(req.user);
    }

    @Post('register')
    async register(@Body() createUserDto: CreateUserDto) {
        return this.authService.register(createUserDto);
    }

    @Get('google')
    @UseGuards(AuthGuard('google'))
    async googleAuth(@Request() req) { }

    @Get('google/callback')
    @UseGuards(AuthGuard('google'))
    async googleAuthRedirect(@Request() req, @Res() res) {
        const user = await this.authService.validateOAuthLogin(req.user);
        const { access_token } = await this.authService.loginOAuth(user);
        // Redirect to frontend with token
        res.redirect(`http://localhost:3000/auth/callback?token=${access_token}&user=${encodeURIComponent(JSON.stringify(user))}`);
    }

    @Get('github')
    @UseGuards(AuthGuard('github'))
    async githubAuth(@Request() req) { }

    @Get('github/callback')
    @UseGuards(AuthGuard('github'))
    async githubAuthRedirect(@Request() req, @Res() res) {
        const user = await this.authService.validateOAuthLogin(req.user);
        const { access_token } = await this.authService.loginOAuth(user);
        res.redirect(`http://localhost:3000/auth/callback?token=${access_token}&user=${encodeURIComponent(JSON.stringify(user))}`);
    }
    @Post('forgot-password')
    async forgotPassword(@Body() body: { email: string }) {
        return this.authService.forgotPassword(body.email);
    }

    @Post('reset-password')
    async resetPassword(@Body() body: { token: string; password: string }) {
        return this.authService.resetPassword(body.token, body.password);
    }
}
