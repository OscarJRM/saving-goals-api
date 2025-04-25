import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common'
import { WithdrawService } from './withdraw.service'
import { CreateWithdrawDto } from './dto/create-withdraw.dto'
import { UpdateWithdrawDto } from './dto/update-withdraw.dto'
import { type User as IUser } from '@prisma/client'
import { User } from 'src/common/decorators/user.decorator'
import { Auth } from '../auth/decorators/auth.decorator'

@Controller('withdraw')
@Auth()
export class WithdrawController {
  constructor(private readonly withdrawService: WithdrawService) {}

  @Post()
  create(@Body() createWithdrawDto: CreateWithdrawDto) {
    return this.withdrawService.create(createWithdrawDto)
  }

  @Get()
  findAll(@User() user: IUser) {
    return this.withdrawService.findAll(user.id)
  }

  @Get('goal/:goalId')
  findByGoal(@Param('goalId') goalId: string) {
    return this.withdrawService.findByGoal(+goalId)
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.withdrawService.findOne(+id)
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateWithdrawDto: UpdateWithdrawDto,
  ) {
    return this.withdrawService.update(+id, updateWithdrawDto)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.withdrawService.remove(+id)
  }
}
