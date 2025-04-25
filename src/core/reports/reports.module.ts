import { Module } from '@nestjs/common'
import { GoalReportsService } from './goal-reports.service'
import { ContributionReportsService } from './contribution-reports.service'
import { GoalReportsController } from './goal-reports.controller'
import { ContributionReportsController } from './contribution-reports.controller'

@Module({
  controllers: [GoalReportsController, ContributionReportsController],
  providers: [ContributionReportsService, GoalReportsService],
})
export class ReportsModule {}
