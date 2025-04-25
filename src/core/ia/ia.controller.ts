import { Body, Controller, Get, Post } from '@nestjs/common'
import { OpenRouterService } from './ia.service'
import { ChatReqDto } from './dto/chat-req.dto'
import { User } from 'src/common/decorators/user.decorator'
import { type User as IUser } from '@prisma/client'
import { Auth } from '../auth/decorators/auth.decorator'

@Controller('ia')
@Auth()
export class IaController {
  constructor(private readonly iaService: OpenRouterService) {}

  @Post()
  async chat(@User() user: IUser, @Body() body: ChatReqDto) {
    return this.iaService.chat(user.id, body)
  }
}
