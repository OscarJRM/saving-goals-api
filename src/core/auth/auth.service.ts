import { HttpStatus, Injectable } from '@nestjs/common'
import { SignInDto } from './dto/sign-in.dto'
import { JwtService } from '@nestjs/jwt'
import { IJwtPayload } from './types/jwt-payload.interface'
import { DisplayableException } from 'src/common/exceptions/displayable.exception'
import { comparePassword, hashPassword } from 'src/common/utils/encrypter'
import { PrismaService } from 'src/global/prisma/prisma.service'
import { SignUpDto } from './dto/sign-up.dto'

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async signIn({ email, password }: SignInDto) {
    const user = await this.prismaService.user.findUnique({
      where: {
        email,
      },
    })

    if (!user)
      throw new DisplayableException(
        'Usuario no encontrado',
        HttpStatus.NOT_FOUND,
      )

    const isPasswordValid = comparePassword(password, user.passwordHash)

    if (!isPasswordValid)
      throw new DisplayableException(
        'Creedenciales incorrectas',
        HttpStatus.BAD_REQUEST,
      )

    return {
      token: this.createToken({ id: user.id }),
    }
  }

  async signUp(dto: SignUpDto) {
    const user = await this.prismaService.user.findUnique({
      where: {
        email: dto.email,
      },
    })

    if (user)
      throw new DisplayableException(
        'El correo ya está en uso',
        HttpStatus.BAD_REQUEST,
      )

    await this.prismaService.user.create({
      data: {
        email: dto.email,
        passwordHash: hashPassword(dto.password),
        firstName: dto.firstName,
        lastName: dto.lastName,
      },
    })
  }

  private createToken = (payload: IJwtPayload) => {
    return this.jwtService.sign(payload)
  }
}
