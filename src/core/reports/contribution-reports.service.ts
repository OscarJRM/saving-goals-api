import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/global/prisma/prisma.service'

@Injectable()
export class ContributionReportsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get contribution history for a specific goal
   */
  async getContributionsByGoal(
    userId: number,
    goalId: number,
    startDate?: Date,
    endDate?: Date,
  ) {
    // First verify the goal belongs to the user
    const goal = await this.prisma.goal.findFirst({
      where: { id: goalId, userId },
      include: { category: true },
    })

    if (!goal) {
      throw new Error('Goal not found or not accessible')
    }

    // Get all contributions for this goal with optional date filtering
    const contributions = await this.prisma.contribution.findMany({
      where: {
        goalId,
        ...(startDate && { contributionDate: { gte: startDate } }),
        ...(endDate && { contributionDate: { lte: endDate } }),
      },
      orderBy: { contributionDate: 'desc' },
    })

    // Calculate summary statistics
    const totalContributed = contributions.reduce(
      (sum, contribution) => sum + Number(contribution.amount),
      0,
    )

    const targetAmount = Number(goal.targetAmount)
    const currentAmount = Number(goal.currentAmount)
    const remainingAmount = Math.max(0, targetAmount - currentAmount)
    const progressPercentage = (currentAmount / targetAmount) * 100

    return {
      goal,
      contributions,
      summary: {
        totalContributions: contributions.length,
        totalContributed,
        targetAmount,
        currentAmount,
        remainingAmount,
        progressPercentage,
      },
    }
  }

  /**
   * Get all contributions for a user across all goals
   */
  async getAllContributions(
    userId: number,
    startDate?: Date,
    endDate?: Date,
    categoryId?: number,
  ) {
    // Get all goals for this user that match filters
    const goals = await this.prisma.goal.findMany({
      where: {
        userId,
        ...(categoryId && { categoryId }),
      },
      include: {
        category: true,
        contributions: {
          where: {
            ...(startDate && { contributionDate: { gte: startDate } }),
            ...(endDate && { contributionDate: { lte: endDate } }),
          },
          orderBy: { contributionDate: 'desc' },
        },
      },
    })

    // Process data for a comprehensive report
    let totalContributions = 0
    let totalContributedAmount = 0

    const contributionsByGoal = goals.map((goal) => {
      const goalContributions = goal.contributions
      const goalTotalAmount = goalContributions.reduce(
        (sum, contribution) => sum + Number(contribution.amount),
        0,
      )

      totalContributions += goalContributions.length
      totalContributedAmount += goalTotalAmount

      return {
        goalId: goal.id,
        goalName: goal.name,
        categoryName: goal.category.name,
        contributionCount: goalContributions.length,
        totalAmount: goalTotalAmount,
        contributions: goalContributions,
      }
    })

    return {
      summary: {
        totalContributions,
        totalContributedAmount,
        goalCount: goals.length,
      },
      contributionsByGoal,
    }
  }

  /**
   * Get contribution frequency statistics
   */
  async getContributionFrequencyStats(
    userId: number,
    startDate?: Date,
    endDate?: Date,
  ) {
    // Get all contributions for this user
    const goals = await this.prisma.goal.findMany({
      where: {
        userId,
      },
      select: {
        id: true,
        name: true,
        contributions: {
          where: {
            ...(startDate && { contributionDate: { gte: startDate } }),
            ...(endDate && { contributionDate: { lte: endDate } }),
          },
          orderBy: { contributionDate: 'asc' },
          select: {
            contributionDate: true,
            amount: true,
          },
        },
      },
    })

    // Analyze contribution frequency
    const frequencyStats = goals.map((goal) => {
      // Skip goals with less than 2 contributions (can't calculate intervals)
      if (goal.contributions.length < 2) {
        return {
          goalId: goal.id,
          goalName: goal.name,
          contributionCount: goal.contributions.length,
          averageInterval: null,
          averageAmount:
            goal.contributions.length > 0
              ? goal.contributions.reduce(
                  (sum, c) => sum + Number(c.amount),
                  0,
                ) / goal.contributions.length
              : 0,
          intervalStats: null,
        }
      }

      // Calculate intervals between contributions in days
      const intervals: number[] = []
      for (let i = 1; i < goal.contributions.length; i++) {
        const currentDate = new Date(goal.contributions[i].contributionDate)
        const prevDate = new Date(goal.contributions[i - 1].contributionDate)
        const diffDays = Math.round(
          (currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24),
        )
        intervals.push(diffDays)
      }

      // Calculate average interval
      const averageInterval =
        intervals.reduce((sum, interval) => sum + interval, 0) /
        intervals.length

      // Calculate average contribution amount
      const averageAmount =
        goal.contributions.reduce(
          (sum, contribution) => sum + Number(contribution.amount),
          0,
        ) / goal.contributions.length

      // Simple frequency categorization
      let frequencyCategory
      if (averageInterval <= 7) {
        frequencyCategory = 'weekly'
      } else if (averageInterval <= 14) {
        frequencyCategory = 'bi-weekly'
      } else if (averageInterval <= 31) {
        frequencyCategory = 'monthly'
      } else {
        frequencyCategory = 'irregular'
      }

      return {
        goalId: goal.id,
        goalName: goal.name,
        contributionCount: goal.contributions.length,
        averageInterval,
        averageAmount,
        frequencyCategory,
        intervals,
      }
    })

    return frequencyStats
  }
}
