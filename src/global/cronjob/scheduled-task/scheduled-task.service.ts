import { Global, Injectable } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { ContributionService } from 'src/core/contribution/contribution.service'

@Global()
@Injectable()
export class ScheduledTasksService {
  constructor(private readonly contributionService: ContributionService) {}

  // Run weekly target recalculations daily at midnight
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleWeeklyTargetRecalculations() {
    console.log('Running scheduled weekly target recalculations...')
    await this.contributionService.recalculateWeeklyTargets()
  }

  // Detect inactive goals every day at 1:00 AM
  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async handleInactivityDetection() {
    console.log('Running scheduled inactivity detection...')
    await this.contributionService.detectInactiveGoals()
  }
}
