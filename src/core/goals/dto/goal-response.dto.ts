import { Goal } from '@prisma/client'

export class GoalResponseDto {
  id: number
  userId: number
  categoryId: number
  name: string
  targetAmount: number
  deadline: Date
  status: string
  initialWeeklyTarget: number | null
  currentWeeklyTarget: number | null
  currentAmount: number
  isAtRisk: boolean
  progress: number
  createdAt: Date
  updatedAt: Date

  constructor(goal: Goal) {
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
    this.progress = this.calculateProgress()
    this.createdAt = goal.createdAt
    this.updatedAt = goal.updatedAt
  }

  private calculateProgress(): number {
    if (this.targetAmount <= 0) return 0
    return Math.min(100, (this.currentAmount / this.targetAmount) * 100)
  }
}
