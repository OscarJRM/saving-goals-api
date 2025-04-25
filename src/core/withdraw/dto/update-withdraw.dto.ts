import { ApiProperty } from '@nestjs/swagger'
import {
  IsDate,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator'
import { Type } from 'class-transformer'

export class UpdateWithdrawDto {
  @ApiProperty({
    description: 'Withdrawal amount',
    example: 25.0,
    minimum: 0.01,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  amount?: number

  @ApiProperty({
    description: 'Date of the withdrawal',
    example: '2025-04-24',
    required: false,
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
