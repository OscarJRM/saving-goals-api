import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { GoalsModule } from './core/goals/goals.module'
import { FinancialCalculatorService } from './core/financial-calculator/financial-calculator.service'
import { PrismaModule } from './global/prisma/prisma.module'
import { CustomConfigModule } from './global/config/config.module'
import { CustomConfigService } from './global/config/config.service'
import { ResponseInterceptor } from './common/interceptors/response.interceptor'

@Module({
  imports: [GoalsModule, PrismaModule, CustomConfigModule],
  controllers: [AppController],
  providers: [
    AppService,
    FinancialCalculatorService,
    CustomConfigService,
    ResponseInterceptor,
  ],
})
export class AppModule {}
