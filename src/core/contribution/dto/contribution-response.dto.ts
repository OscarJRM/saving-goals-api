import { ApiProperty } from '@nestjs/swagger'

export class ContributionResponseDto {
  @ApiProperty({ example: 1 })
  contribution_id: number

  @ApiProperty({ example: 1 })
  goal_id: number

  @ApiProperty({ example: 50.0 })
  amount: number

  @ApiProperty({ example: '2025-04-24' })
  contribution_date: Date

  @ApiProperty({ example: 'Saved from my monthly bonus' })
  notes?: string

  @ApiProperty({ example: '2025-04-24T12:00:00.000Z' })
  created_at: Date
}
