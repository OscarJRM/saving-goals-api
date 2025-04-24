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

export class CreateWithdrawDto {
  @ApiProperty({
    description: 'ID of the goal this withdrawal belongs to',
    example: 1,
  })
  @IsNotEmpty()
  @IsNumber()
  goalId: number

  @ApiProperty({
    description: 'Withdrawal amount',
    example: 25.0,
    minimum: 0.01,
  })
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  amount: number

  @ApiProperty({
    description: 'Date of the withdrawal',
    example: '2025-04-24',
    default: new Date().toISOString().split('T')[0],
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  withdrawalDate?: Date

  @ApiProperty({
    description: 'Optional notes about the withdrawal',
    example: 'Emergency expense',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string
}
