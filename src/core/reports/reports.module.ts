import { Module } from '@nestjs/common'
import { GoalReportsService } from './goal-reports.service'
import { ContributionReportsService } from './contribution-reports.service'
import { GoalReportsController } from './goal-reports.controller'
import { ContributionReportsController } from './contribution-reports.controller'
import { GoalReportCreatorService } from './goal-report-creator.service'

@Module({
  controllers: [GoalReportsController, ContributionReportsController],
  providers: [
    ContributionReportsService,
    GoalReportsService,
    GoalReportCreatorService,
  ],
})
export class ReportsModule {}
