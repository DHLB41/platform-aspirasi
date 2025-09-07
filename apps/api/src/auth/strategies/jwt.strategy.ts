import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from '../auth.service';

export interface JwtPayload {
    sub: string; // User ID
    email: string;
    roles: string[];
    iat?: number; // Issued at
    exp?: number; // Expiration time
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        private configService: ConfigService,
        private authService: AuthService,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get('JWT_SECRET'),
        });
    }

    async validate(payload: JwtPayload) {
        const user = await this.authService.validateJwtPayload(payload);

        if (!user) {
            throw new UnauthorizedException('Invalid token');
        }
        return {
            id: user.id,
            email: user.email,
            name: user.name,
            roles: user.roles,
        };
    }
}