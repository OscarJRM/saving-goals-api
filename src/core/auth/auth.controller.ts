import { Body, Controller, Get, HttpCode, Post, Request } from '@nestjs/common'
import { AuthService } from './auth.service'
import { SignInDto } from './dto/sign-in.dto'
import { AdminAuth } from 'src/core/auth/decorators/auth.decorator'
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'
import { SignUpDto } from './dto/sign-up.dto'

@ApiBearerAuth()
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('sign-in')
  @HttpCode(200)
  @ApiOperation({ summary: 'Sign in a user' })
  @ApiResponse({ status: 200, description: 'User signed in successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async signIn(@Body() dto: SignInDto) {
    return this.authService.signIn(dto)
  }

  @Post('sign-up')
  @HttpCode(201)
  @ApiOperation({ summary: 'Sign up a new user' })
  @ApiResponse({ status: 201, description: 'User signed up successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async signUp(@Body() dto: SignUpDto) {
    return this.authService.signUp(dto)
  }

  @Get('me')
  @AdminAuth()
  @ApiOperation({ summary: 'Get current user information' })
  @ApiResponse({
    status: 200,
    description: 'Current user information retrieved successfully',
  })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  getMe(@Request() req) {
    const user = req.user
    return user
  }
}
