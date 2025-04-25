import { HttpStatus, Injectable } from '@nestjs/common'
import { SignInDto } from './dto/sign-in.dto'
import { JwtService } from '@nestjs/jwt'
import { IJwtPayload } from './types/jwt-payload.interface'
import { DisplayableException } from 'src/common/exceptions/displayable.exception'
import { comparePassword, hashPassword } from 'src/common/utils/encrypter'
import { PrismaService } from 'src/global/prisma/prisma.service'
import { SignUpDto } from './dto/sign-up.dto'
import { Admin, User } from '@prisma/client'

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async signIn({ email, password }: SignInDto) {
    const user = await this.prismaService.user.findUnique({
      where: { email },
    })

    if (!user) {
      const admin = await this.prismaService.admin.findUnique({
        where: { email },
      })

      if (!admin) {
        throw new DisplayableException(
          'Usuario no encontrado',
          HttpStatus.NOT_FOUND,
        )
      }

      this.verifyPassword(password, admin.password)

      return {
        token: this.createToken({
          id: admin.id,
          isAdmin: true,
        }),
        user: {
          id: admin.id,
          email: admin.email,
          firstName: admin.firstName,
          lastName: admin.lastName,
        },
      }
    }

    this.verifyPassword(password, user.passwordHash)

    return {
      token: this.createToken({
        id: user.id,
        isAdmin: false,
      }),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
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
        profilePicture: dto.profilePicture,
        birthDate: dto.birthDate,
        gender: dto.gender,
      },
    })
  }

  private createToken = (payload: IJwtPayload) => {
    return this.jwtService.sign(payload)
  }

  async isAdmin(email: string): Promise<boolean> {
    const admin = await this.prismaService.admin.findUnique({
      where: { email },
    })
    return !!admin
  }

  async validateUser(
    id: number,
    isAdmin: boolean,
  ): Promise<User | Admin | null> {
    if (isAdmin) {
      return await this.prismaService.admin.findUnique({ where: { id } })
    }
    return await this.prismaService.user.findUnique({
      where: {
        id,
      },
    })
  }

  private verifyPassword(password: string, userPassword: string) {
    const isPasswordValid = comparePassword(password, userPassword)

    if (!isPasswordValid)
      throw new DisplayableException(
        'Creedenciales incorrectas',
        HttpStatus.BAD_REQUEST,
      )

    return isPasswordValid
  }

  verifyToken = (token: string) => {
    try {
      return this.jwtService.verify(token)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      throw new DisplayableException('Token inválido', HttpStatus.UNAUTHORIZED)
    }
  }
}
