import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { GoalsModule } from './goals/goals.module';
import { FinancialCalculatorService } from './financial-calculator/financial-calculator.service';

@Module({
  imports: [GoalsModule],
  controllers: [AppController],
  providers: [AppService, FinancialCalculatorService ],
})
export class AppModule {}
