import { Injectable } from '@nestjs/common'
import { MailerService } from '@nestjs-modules/mailer'
import { Goal } from '@prisma/client'

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendTestEmail(to: string) {
    await this.mailerService.sendMail({
      to,
      subject: 'Correo de prueba desde NestJS + Gmail',
      template: 'welcome',
      context: {
        name: 'Usuario',
      },
    })
  }

  async sendWeeklyReminderEmail(to: string, goals: Goal[], userName: string) {
    const processedGoals = goals.map((goal) => {
      const current = goal.currentAmount.toNumber()
      const target = goal.targetAmount.toNumber()
      const progress = ((current / target) * 100).toFixed(2)

      return {
        name: goal.name,
        currentAmount: current.toFixed(2),
        targetAmount: target.toFixed(2),
        progressPercentage: progress,
        isAtRisk: goal.isAtRisk,
        weeklyTarget: goal.currentWeeklyTarget?.toFixed(2) || null,
      }
    })

    await this.mailerService.sendMail({
      to,
      subject: 'Recordatorio semanal de metas',
      template: 'weekly-reminder',
      context: {
        name: userName,
        goals: processedGoals,
        appUrl: process.env.FRONTEND_URL || 'https://tuaplicacion.com',
        year: new Date().getFullYear(),
      },
    })
  }
}
