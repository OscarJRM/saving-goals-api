import { Module } from '@nestjs/common';
import { GoalsService } from './goals.service';
import { GoalsController } from './goals.controller';
import { FinancialCalculatorService } from 'src/financial-calculator/financial-calculator.service';
import { PrismaService } from 'src/utils/prisma/prisma.service';

@Module({
  controllers: [GoalsController],
  providers: [GoalsService, FinancialCalculatorService, PrismaService],
})
export class GoalsModule {}
