import { Injectable, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { IJwtPayload } from '../types/jwt-payload.interface'
import { User } from '@prisma/client'
import { PrismaService } from 'src/global/prisma/prisma.service'
import { Request } from 'express'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly prismaService: PrismaService) {
    super({
      secretOrKey: process.env.JWT_SECRET!,
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    })
  }

  authenticate(req: Request, options?: unknown): void {
    if (!req.headers.authorization) {
      throw new UnauthorizedException('Token not found')
    }

    super.authenticate(req, options)
  }

  async validate(payload: IJwtPayload): Promise<User> {
    const { id } = payload

    const user = await this.prismaService.user.findUnique({ where: { id } })

    if (!user) throw new UnauthorizedException('Token not valid')

    // if (!user.active)
    //   throw new UnauthorizedException('User is inactive, talk with an admin')

    return user
  }
}
