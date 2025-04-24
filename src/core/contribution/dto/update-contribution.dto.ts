import { ApiProperty } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import {
  IsDate,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator'

export class UpdateContributionDto {
  @ApiProperty({
    description: 'Contribution amount',
    example: 75.0,
    minimum: 0.01,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  amount?: number

  @ApiProperty({
    description: 'Date of the contribution',
    example: '2025-04-24',
    required: false,
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  contribution_date?: Date

  @ApiProperty({
    description: 'Optional notes about the contribution',
    example: 'Updated after recalculation',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string
}
