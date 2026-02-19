
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GitHubStrategy extends PassportStrategy(Strategy, 'github') {
    constructor(private configService: ConfigService) {
        super({
            clientID: configService.getOrThrow<string>('GITHUB_CLIENT_ID'),
            clientSecret: configService.getOrThrow<string>('GITHUB_CLIENT_SECRET'),
            callbackURL: configService.getOrThrow<string>('GITHUB_CALLBACK_URL'),
            scope: ['user:email'],
        });
    }

    async validate(
        accessToken: string,
        refreshToken: string,
        profile: any,
        done: Function,
    ): Promise<any> {
        const { username, displayName, emails, photos, id } = profile;
        // GitHub might not return email if it's private, handle that case if needed
        // Usually we ask for user:email scope
        const email = emails && emails[0] ? emails[0].value : null;

        const user = {
            email: email,
            username: username,
            firstName: displayName ? displayName.split(' ')[0] : username,
            lastName: displayName && displayName.split(' ').length > 1 ? displayName.split(' ').slice(1).join(' ') : '',
            picture: photos && photos[0] ? photos[0].value : null,
            provider: 'github',
            providerId: id,
            accessToken,
        };
        done(null, user);
    }
}
