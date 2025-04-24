import { Global, Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { ContributionService } from 'src/core/contribution/contribution.service'

@Global()
@Injectable()
export class ScheduledTasksService {
  constructor(private readonly contributionService: ContributionService) {}

  private readonly logger = new Logger(ScheduledTasksService.name)
  // Run weekly target recalculations daily at midnight
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleWeeklyTargetRecalculations() {
    this.logger.log('Running scheduled weekly target recalculations...')
    await this.contributionService.recalculateWeeklyTargets()
  }

  // Detect inactive goals every day at 1:00 AM
  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async handleInactivityDetection() {
    this.logger.log('Running scheduled inactivity detection...')
    await this.contributionService.detectInactiveGoals()
  }
}
