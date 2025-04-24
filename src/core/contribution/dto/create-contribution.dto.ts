import { ApiProperty } from '@nestjs/swagger'
import {
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator'
import { Type } from 'class-transformer'

export class CreateContributionDto {
  @ApiProperty({
    description: 'ID of the goal this contribution belongs to',
    example: 1,
  })
  @IsNotEmpty()
  @IsNumber()
  goalId: number

  @ApiProperty({
    description: 'Contribution amount',
    example: 50.0,
    minimum: 0.01,
  })
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  amount: number

  @ApiProperty({
    description: 'Date of the contribution',
    example: '2025-04-24',
    default: new Date().toISOString().split('T')[0],
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  contributionDate?: Date

  @ApiProperty({
    description: 'Optional notes about the contribution',
    example: 'Saved from my monthly bonus',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string
}
