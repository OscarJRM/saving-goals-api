import { Injectable, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { IJwtPayload } from '../types/jwt-payload.interface'
import { Admin, User } from '@prisma/client'
import { Request } from 'express'
import { AuthService } from '../auth.service'
import { CustomConfigService } from 'src/global/config/config.service'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: CustomConfigService,
  ) {
    super({
      secretOrKey: configService.env.JWT_SECRET,
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    })
  }

  authenticate(req: Request, options?: unknown): void {
    if (!req.headers.authorization) {
      throw new UnauthorizedException('Token not found')
    }

    super.authenticate(req, options)
  }

  async validate(payload: IJwtPayload): Promise<User | Admin> {
    const userOrAdmin = await this.authService.validateUser(
      payload.id,
      payload.isAdmin,
    )

    if (!userOrAdmin) throw new UnauthorizedException('Token not valid')

    return userOrAdmin
  }
}
