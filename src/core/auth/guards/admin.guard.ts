import {
  CanActivate,
  ExecutionContext,
  Injectable,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common'
import { AuthService } from '../auth.service'

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()
    const admin = request.user

    if (!admin) throw new BadRequestException('Admin not found')

    const isAdmin = await this.authService.isAdmin(String(admin.email))

    if (!isAdmin) throw new ForbiddenException('User is not an admin')

    return true
  }
}
