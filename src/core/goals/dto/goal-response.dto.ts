import { ApiResponseProperty } from '@nestjs/swagger'
import { Goal } from '@prisma/client'

export class GoalResponseDto {
  @ApiResponseProperty({
    example: 1,
    type: Number,
  })
  id: number
  @ApiResponseProperty({
    example: 1,
    type: Number,
  })
  userId: number
  @ApiResponseProperty({
    example: 1,
    type: Number,
  })
  categoryId: number
  @ApiResponseProperty({
    example: 'Ahorro para vacaciones',
    type: String,
  })
  name: string
  @ApiResponseProperty({
    example: 12345,
    type: Number,
  })
  targetAmount: number
  @ApiResponseProperty({
    example: '2025-12-31',
    type: Date,
  })
  deadline: Date
  @ApiResponseProperty({
    example: 'active',
    type: String,
  })
  status: string
  @ApiResponseProperty({
    example: 100,
    type: Number,
  })
  initialWeeklyTarget: number | null
  @ApiResponseProperty({
    example: 50,
    type: Number,
  })
  currentWeeklyTarget: number | null
  @ApiResponseProperty({
    example: 5000,
    type: Number,
  })
  currentAmount: number
  @ApiResponseProperty({
    example: false,
    type: Boolean,
  })
  isAtRisk: boolean
  @ApiResponseProperty({
    example: 50,
    type: Number,
  })
  progress: number
  @ApiResponseProperty({
    example: '2023-10-01T00:00:00.000Z',
    type: Date,
  })
  createdAt: Date
  @ApiResponseProperty({
    example: '2023-10-01T00:00:00.000Z',
    type: Date,
  })
  updatedAt: Date

  constructor(goal: Goal, progress: number) {
    this.id = goal.id
    this.userId = goal.userId
    this.categoryId = goal.categoryId
    this.name = goal.name
    this.targetAmount = parseFloat(goal.targetAmount.toString())
    this.deadline = goal.deadline
    this.status = goal.status
    this.initialWeeklyTarget = goal.initialWeeklyTarget
      ? parseFloat(goal.initialWeeklyTarget.toString())
      : null
    this.currentWeeklyTarget = goal.currentWeeklyTarget
      ? parseFloat(goal.currentWeeklyTarget.toString())
      : null
    this.currentAmount = parseFloat(goal.currentAmount.toString())
    this.isAtRisk = goal.isAtRisk
    this.progress = progress
    this.createdAt = goal.createdAt
    this.updatedAt = goal.updatedAt
  }
}
