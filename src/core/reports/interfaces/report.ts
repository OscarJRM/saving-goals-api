import { Category, Contribution, Goal } from '@prisma/client'

export interface GoalByStatus extends Goal {
  category: Category
  contributions: Contribution[]
}
