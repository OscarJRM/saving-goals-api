import { Controller, Get, Param, Query, ParseIntPipe } from '@nestjs/common'
import { Auth } from '../auth/decorators/auth.decorator'
import { User } from 'src/common/decorators/user.decorator'
import { type User as IUser } from '@prisma/client'
import { ContributionReportsService } from './contribution-reports.service'

@Controller('reports/contributions')
@Auth()
export class ContributionReportsController {
  constructor(
    private readonly contributionReportsService: ContributionReportsService,
  ) {}

  @Get('goal/:goalId')
  async getContributionsByGoal(
    @User() user: IUser,
    @Param('goalId', ParseIntPipe) goalId: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.contributionReportsService.getContributionsByGoal(
      user.id,
      goalId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    )
  }

  @Get('all')
  async getAllContributions(
    @User() user: IUser,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('categoryId', ParseIntPipe) categoryId?: number,
  ) {
    return this.contributionReportsService.getAllContributions(
      user.id,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
      categoryId,
    )
  }

  @Get('frequency')
  async getContributionFrequencyStats(
    @User() user: IUser,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.contributionReportsService.getContributionFrequencyStats(
      user.id,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    )
  }
}
