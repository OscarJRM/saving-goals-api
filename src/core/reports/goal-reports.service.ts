import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/global/prisma/prisma.service'

@Injectable()
export class GoalReportsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get goals by status (completed, expired, in-progress)
   */
  async getGoalsByStatus(
    userId: number,
    status: 'completed' | 'expired' | 'in-progress',
    startDate?: Date,
    endDate?: Date,
  ) {
    const now = new Date()

    // Base query filters (filtro por fecha si existe)
    const dateFilter = {}
    if (startDate) {
      dateFilter['createdAt'] = {
        ...(dateFilter['createdAt'] || {}),
        gte: startDate,
      }
    }
    if (endDate) {
      dateFilter['createdAt'] = {
        ...(dateFilter['createdAt'] || {}),
        lte: endDate,
      }
    }

    // Obtenemos todos los objetivos del usuario (con los filtros de fecha si aplican)
    const allGoals = await this.prisma.goal.findMany({
      where: {
        userId,
        ...dateFilter,
      },
      include: {
        category: true,
        contributions: {
          orderBy: { contributionDate: 'desc' },
        },
      },
      orderBy: { deadline: 'asc' },
    })

    // Filtramos según el estado requerido
    switch (status) {
      case 'completed':
        return allGoals.filter(
          (goal) =>
            goal.currentAmount.toNumber() >= goal.targetAmount.toNumber(),
        )

      case 'expired':
        return allGoals.filter(
          (goal) =>
            goal.deadline < now &&
            goal.currentAmount.toNumber() < goal.targetAmount.toNumber(),
        )

      case 'in-progress':
        return allGoals.filter(
          (goal) => goal.deadline >= now && goal.status === 'active',
        )

      default:
        return []
    }
  }

  /**
   * Get goals grouped by category with summary statistics
   */
  async getGoalsByCategory(userId: number, startDate?: Date, endDate?: Date) {
    // First get all categories with their goals
    const categories = await this.prisma.category.findMany({
      include: {
        goals: {
          where: {
            userId,
            ...(startDate && { createdAt: { gte: startDate } }),
            ...(endDate && { createdAt: { lte: endDate } }),
          },
          include: {
            contributions: true,
          },
        },
      },
    })

    console.log(categories)

    // Process the data to calculate statistics per category
    return categories.map((category) => {
      const totalTargetAmount = category.goals.reduce(
        (sum, goal) => sum + Number(goal.targetAmount),
        0,
      )

      const totalCurrentAmount = category.goals.reduce(
        (sum, goal) => sum + Number(goal.currentAmount),
        0,
      )

      const completedGoals = category.goals.filter(
        (goal) => Number(goal.currentAmount) >= Number(goal.targetAmount),
      )

      return {
        categoryId: category.id,
        name: category.name,
        description: category.description,
        icon: category.icon,
        goalCount: category.goals.length,
        completedGoalCount: completedGoals.length,
        totalTargetAmount,
        totalCurrentAmount,
        progressPercentage:
          totalTargetAmount > 0
            ? (totalCurrentAmount / totalTargetAmount) * 100
            : 0,
        goals: category.goals,
      }
    })
  }

  /**
   * Get goals at risk (marked as at risk or approaching deadline with low progress)
   */
  async getGoalsAtRisk(userId: number) {
    const now = new Date()
    const thirtyDaysFromNow = new Date(now)
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

    // 1. Obtenemos todos los objetivos del usuario
    const allGoals = await this.prisma.goal.findMany({
      where: {
        userId,
        deadline: { gte: now }, // Solo objetivos que no hayan expirado
        status: 'active', // Opcional: si tienes un campo de estado
      },
      include: {
        category: true,
        contributions: {
          orderBy: { contributionDate: 'desc' },
          take: 5,
        },
      },
      orderBy: { deadline: 'asc' },
    })

    // 2. Filtramos los objetivos en riesgo
    const goalsAtRisk = allGoals.filter((goal) => {
      const isCloseToDeadline = goal.deadline < thirtyDaysFromNow
      const isLessThan70Percent =
        goal.currentAmount.toNumber() < goal.targetAmount.toNumber() * 0.7
      const isAtRiskFlag = goal.isAtRisk // Si ya está marcado como en riesgo

      return isAtRiskFlag || (isCloseToDeadline && isLessThan70Percent)
    })

    return goalsAtRisk
  }

  /**
   * Get weekly/monthly progress for a specific goal
   */
  async getGoalProgressTimeline(
    userId: number,
    goalId: number,
    period: 'weekly' | 'monthly',
  ) {
    // First verify the goal belongs to the user
    const goal = await this.prisma.goal.findFirst({
      where: { id: goalId, userId },
    })

    if (!goal) {
      throw new Error('Goal not found or not accessible')
    }

    // Get all contributions for this goal
    const contributions = await this.prisma.contribution.findMany({
      where: { goalId },
      orderBy: { contributionDate: 'asc' },
    })

    // Group contributions by week or month
    const timelineData = {}

    contributions.forEach((contribution) => {
      const date = new Date(contribution.contributionDate)
      let periodKey: string

      if (period === 'weekly') {
        // Get start of week (Sunday)
        const startOfWeek = new Date(date)
        startOfWeek.setDate(date.getDate() - date.getDay())
        periodKey = startOfWeek.toISOString().split('T')[0]
      } else {
        // Monthly - use yyyy-mm
        periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      }

      if (!timelineData[periodKey]) {
        timelineData[periodKey] = {
          period: periodKey,
          totalAmount: 0,
          count: 0,
        }
      }

      timelineData[periodKey].totalAmount += Number(contribution.amount)
      timelineData[periodKey].count += 1
    })

    // Convert to array and sort
    return Object.values(timelineData).sort((a: any, b: any) =>
      a.period.localeCompare(b.period),
    )
  }
}
