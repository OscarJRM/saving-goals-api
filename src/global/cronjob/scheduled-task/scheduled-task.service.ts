import { Global, Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { ContributionService } from 'src/core/contribution/contribution.service'
import { GoalsService } from 'src/core/goals/goals.service'
import { PrismaService } from 'src/global/prisma/prisma.service'
import { MailService } from 'src/services/mail/mail.service'

@Global()
@Injectable()
export class ScheduledTasksService {
  constructor(
    private readonly contributionService: ContributionService,
    private readonly goalsService: GoalsService,
    private readonly emailService: MailService,
    private readonly prismaService: PrismaService,
  ) {}

  private readonly logger = new Logger(ScheduledTasksService.name)
  // Run weekly target recalculations daily at midnight
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleWeeklyTargetRecalculations() {
    this.logger.log('Running scheduled weekly target recalculations...')
    await this.contributionService.recalculateWeeklyTargets()
  }

  // Detect inactive goals every day at 1:00 AM
  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async handleExpiredGoals() {
    this.logger.log('Running scheduled expired goals detection...')
    await this.goalsService.checkExpiredGoals()
  }

  // @Cron(CronExpression.EVERY_WEEK)
  // async handleWeeklyTargetRecalculation() {
  //   this.logger.log('Running scheduled weekly target recalculation...')
  //   await this.goalsService.recalculateWeeklyTargets()
  // }

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async handleInactivityDetection() {
    this.logger.log('Running scheduled inactivity detection...')
    await this.contributionService.detectInactiveGoals()
  }

  @Cron(CronExpression.EVERY_WEEK)
  async sendWeeklyEmail() {
    this.logger.log('Running scheduled weekly email sending...')

    const users = await this.prismaService.user.findMany({
      where: {
        goals: {
          some: {
            status: {
              in: ['active'],
            },
          },
        },
      },
      include: {
        goals: {
          where: {
            status: 'active',
          },
        },
      },
    })
    for (const user of users) {
      if (user.goals.length > 0) {
        await this.emailService.sendWeeklyReminderEmail(
          user.email,
          user.goals,
          `${user.firstName} ${user.lastName}`,
        )
      }
    }
  }
}
