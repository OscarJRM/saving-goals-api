import { Body, Controller, Get, HttpCode, Post, Request } from '@nestjs/common'
import { AuthService } from './auth.service'
import { SignInDto } from './dto/sign-in.dto'
import { Auth } from 'src/core/auth/decorators/auth.decorator'
import { ApiBearerAuth } from '@nestjs/swagger'
import { SignUpDto } from './dto/sign-up.dto'

@ApiBearerAuth()
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('sign-in')
  @HttpCode(200)
  async signIn(@Body() dto: SignInDto) {
    return this.authService.signIn(dto)
  }

  @Post('sign-up')
  @HttpCode(201)
  async signUp(@Body() dto: SignUpDto) {
    return this.authService.signUp(dto)
  }

  @Get('me')
  @Auth()
  getMe(@Request() req) {
    const user = req.user
    return user
  }
}
