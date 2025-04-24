import { Module } from '@nestjs/common'
import { GoalsService } from './goals.service'
import { GoalsController } from './goals.controller'
import { FinancialCalculatorService } from 'src/core/financial-calculator/financial-calculator.service'

@Module({
  controllers: [GoalsController],
  providers: [GoalsService, FinancialCalculatorService],
})
export class GoalsModule {}
