import { ApiProperty } from '@nestjs/swagger'

export class WithdrawResponseDto {
  @ApiProperty({ example: 1 })
  withdrawalId: number

  @ApiProperty({ example: 1 })
  goalId: number

  @ApiProperty({ example: 25.0 })
  amount: number

  @ApiProperty({ example: '2025-04-24' })
  withdrawalDate: Date

  @ApiProperty({ example: 'Emergency expense' })
  notes?: string

  @ApiProperty({ example: '2025-04-24T12:00:00.000Z' })
  createdAt: Date
}
