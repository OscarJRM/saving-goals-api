import { Module } from '@nestjs/common'
import { OpenRouterService } from './ia.service'
import { GoalsModule } from '../goals/goals.module'
import { IaController } from './ia.controller'

@Module({
  controllers: [IaController],
  providers: [OpenRouterService],
  exports: [OpenRouterService],
  imports: [GoalsModule],
})
export class IaModule {}
