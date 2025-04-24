import { ApiProperty } from '@nestjs/swagger'

export class SuggestionResponseDto {
  @ApiProperty({
    description: 'Unique identifier for the suggestion',
    example: 1,
  })
  id: number

  @ApiProperty({
    description: 'Identifier of the associated goal',
    example: 101,
  })
  goalId: number

  @ApiProperty({
    description: 'Message describing the suggestion',
    example: 'Consider saving more this month.',
  })
  message: string

  @ApiProperty({
    description: 'Suggested amount to save',
    example: 150.75,
    nullable: true,
  })
  suggestedAmount?: number

  @ApiProperty({
    description: 'Frequency of the suggestion',
    example: 'monthly',
  })
  frequency: string

  @ApiProperty({
    description: 'Indicates if the suggestion is active',
    example: true,
  })
  isActive: boolean

  @ApiProperty({
    description: 'Timestamp when the suggestion was created',
    example: '2023-01-01T12:00:00Z',
  })
  createdAt: Date
}
