import { Controller, Get, Param, Query, ParseIntPipe } from '@nestjs/common'
import { GoalReportsService } from './goal-reports.service'
import { User } from 'src/common/decorators/user.decorator'
import { Auth } from '../auth/decorators/auth.decorator'
import { type User as IUser } from '@prisma/client'
import { GoalReportCreatorService } from './goal-report-creator.service'

@Controller('reports/goals')
@Auth()
export class GoalReportsController {
  constructor(
    private readonly goalReportsService: GoalReportsService,
    private readonly reportCreator: GoalReportCreatorService,
  ) {}

  @Get('status/category')
  async getGoalsByCategory(
    @User() user: IUser,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const data = await this.goalReportsService.getGoalsByCategory(
      user.id,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    )

    return data
  }

  @Get('status/:status')
  async getGoalsByStatus(
    @User() user: IUser,
    @Param('status') status: 'completed' | 'expired' | 'in-progress',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const data = await this.goalReportsService.getGoalsByStatus(
      user.id,
      status,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    )

    this.reportCreator.generateGoalsReport(data, 'Goals_Report.xlsx')

    return data
  }

  @Get('at-risk')
  async getGoalsAtRisk(@User() user: IUser) {
    return this.goalReportsService.getGoalsAtRisk(user.id)
  }

  @Get(':goalId/progress')
  async getGoalProgressTimeline(
    @User() user: IUser,
    @Param('goalId', ParseIntPipe) goalId: number,
    @Query('period') period: 'weekly' | 'monthly' = 'weekly',
  ) {
    return this.goalReportsService.getGoalProgressTimeline(
      user.id,
      goalId,
      period,
    )
  }
}
