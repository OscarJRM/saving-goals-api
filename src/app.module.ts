import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { GoalsModule } from './core/goals/goals.module'
import { FinancialCalculatorService } from './core/financial-calculator/financial-calculator.service'
import { PrismaModule } from './global/prisma/prisma.module'

@Module({
  imports: [GoalsModule, PrismaModule],
  controllers: [AppController],
  providers: [AppService, FinancialCalculatorService],
})
export class AppModule {}
