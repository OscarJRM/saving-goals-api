import { applyDecorators, UseGuards } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { AdminGuard } from 'src/core/auth/guards/admin.guard'
import { JwtAuthGuard } from 'src/core/auth/guards/jwt-auth.guard'

export function Auth() {
  return applyDecorators(UseGuards(AuthGuard('jwt')))
}

export function AdminAuth() {
  return applyDecorators(UseGuards(JwtAuthGuard, AdminGuard))
}
