import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { GoalsModule } from './core/goals/goals.module'
import { FinancialCalculatorService } from './core/financial-calculator/financial-calculator.service'
import { PrismaModule } from './global/prisma/prisma.module'
import { CustomConfigModule } from './global/config/config.module'
import { CustomConfigService } from './global/config/config.service'
import { ResponseInterceptor } from './common/interceptors/response.interceptor'
import { AuthModule } from './core/auth/auth.module'
import { ContributionModule } from './core/contribution/contribution.module'
import { ScheduleModule } from '@nestjs/schedule'
import { SuggestionModule } from './core/suggestion/suggestion.module'
import { MailModule } from './services/mail/mail.module'
import { PdfModule } from './services/pdf/pdf.module'
import { ScheduledTasksService } from './global/cronjob/scheduled-task/scheduled-task.service'
import { WithdrawModule } from './core/withdraw/withdraw.module'
import { ExcelModule } from './services/excel/excel.module'
import { ReportsModule } from './core/reports/reports.module'

@Module({
  imports: [
    ScheduleModule.forRoot(),
    GoalsModule,
    PrismaModule,
    CustomConfigModule,
    AuthModule,
    ContributionModule,
    SuggestionModule,
    MailModule,
    PdfModule,
    WithdrawModule,
    ExcelModule,
    ReportsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    FinancialCalculatorService,
    CustomConfigService,
    ResponseInterceptor,
    ScheduledTasksService,
  ],
})
export class AppModule {}
