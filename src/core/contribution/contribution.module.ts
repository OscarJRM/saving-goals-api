import { Module } from '@nestjs/common'
import { ContributionService } from './contribution.service'
import { ContributionController } from './contribution.controller'

@Module({
  controllers: [ContributionController],
  providers: [ContributionService],
  exports: [ContributionService],
})
export class ContributionModule {}
