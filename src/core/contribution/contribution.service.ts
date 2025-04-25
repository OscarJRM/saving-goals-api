import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common'
import { Goal, Prisma } from '@prisma/client'
import { PrismaService } from 'src/global/prisma/prisma.service'
import { CreateContributionDto } from './dto/create-contribution.dto'
import { UpdateContributionDto } from './dto/update-contribution.dto'

@Injectable()
export class ContributionService {
  constructor(private prisma: PrismaService) {}

  // CRUD Operations
  async findAll(userId: number) {
    return this.prisma.contribution.findMany({
      where: {
        goal: {
          userId,
        },
      },
      include: {
        goal: true,
      },
      orderBy: { contributionDate: 'desc' },
    })
  }

  async findByGoal(goalId: number) {
    return this.prisma.contribution.findMany({
      where: { goalId },
      orderBy: { contributionDate: 'desc' },
    })
  }

  async findOne(id: number) {
    const contribution = await this.prisma.contribution.findUnique({
      where: { id },
      include: { goal: true },
    })

    if (!contribution) {
      throw new NotFoundException(`Contribution with ID ${id} not found`)
    }

    return contribution
  }

  async create(createContributionDto: CreateContributionDto) {
    // Validate contribution amount is positive
    if (createContributionDto.amount <= 0) {
      throw new BadRequestException(
        'Contribution amount must be greater than 0',
      )
    }

    // Find the associated goal
    const goal = await this.prisma.goal.findUnique({
      where: { id: createContributionDto.goalId },
    })

    if (!goal) {
      throw new NotFoundException(
        `Goal with ID ${createContributionDto.goalId} not found`,
      )
    }

    if (goal.status !== 'active') {
      throw new BadRequestException(
        `Cannot add contributions to a ${goal.status} goal`,
      )
    }

    // Use transaction to ensure data consistency
    return this.prisma.$transaction(async (prisma) => {
      // Create the contribution with validated date
      const contribution = await prisma.contribution.create({
        data: {
          amount: createContributionDto.amount,
          contributionDate:
            createContributionDto.contributionDate || new Date(),
          notes: createContributionDto.notes || '',
          goal: {
            connect: { id: createContributionDto.goalId },
          },
        },
      })

      // Calculate new current amount
      const newCurrentAmount =
        goal.currentAmount.toNumber() + contribution.amount.toNumber()

      // Update goal data
      const updateData: Prisma.GoalUpdateInput = {
        currentAmount: newCurrentAmount,
        lastContributionDate: contribution.contributionDate,
        isAtRisk: false, // Reset risk status after contribution
        needsRecalculation: true, // Flag for recalculation
      }

      // Check if goal is completed
      if (newCurrentAmount >= goal.targetAmount.toNumber()) {
        updateData.status = 'completed'

        // Create completion achievement
        await this.createAchievement(
          prisma,
          goal.id,
          'goal_completed',
          `¡Felicitaciones! Has alcanzado tu meta "${goal.name}" con éxito.`,
        )
      }

      // Update the goal with new data
      await prisma.goal.update({
        where: { id: goal.id },
        data: updateData,
      })

      // Check if this is the first contribution to create achievement
      const contributionCount = await prisma.contribution.count({
        where: { goalId: goal.id },
      })

      if (contributionCount === 1) {
        await this.createAchievement(
          prisma,
          goal.id,
          'first_contribution',
          `¡Felicidades! Has realizado tu primera contribución hacia la meta "${goal.name}".`,
        )
      }

      // Check progress milestones
      await this.checkMilestones(prisma, {
        ...goal,
        currentAmount: new Prisma.Decimal(newCurrentAmount),
      })

      // Calculate weekly target and create new suggestion
      const remainingAmount = Math.max(
        0,
        goal.targetAmount.toNumber() - newCurrentAmount,
      )
      const currentDate = new Date()
      const deadline = new Date(goal.deadline)
      const msPerWeek = 1000 * 60 * 60 * 24 * 7
      const weeksLeft = Math.max(
        1,
        Math.ceil((deadline.getTime() - currentDate.getTime()) / msPerWeek),
      )
      const newWeeklyTarget = remainingAmount / weeksLeft

      // Update the latest suggestion to set isActive to false
      await prisma.suggestion.updateMany({
        where: { goalId: goal.id, isActive: true },
        data: { isActive: false },
      })

      // Create a new suggestion with updated target
      await prisma.suggestion.create({
        data: {
          goalId: goal.id,
          message: `Para alcanzar tu meta a tiempo, deberías ahorrar $${newWeeklyTarget.toFixed(2)} por semana.`,
          suggestedAmount: newWeeklyTarget,
          frequency: 'weekly',
          isActive: true,
        },
      })

      return contribution
    })
  }

  async update(id: number, updateContributionDto: UpdateContributionDto) {
    // Validate amount if provided
    if (
      updateContributionDto.amount !== undefined &&
      updateContributionDto.amount <= 0
    ) {
      throw new BadRequestException(
        'Contribution amount must be greater than 0',
      )
    }

    const contribution = await this.findOne(id)
    const oldAmount = contribution.amount

    return this.prisma.$transaction(async (prisma) => {
      // Update contribution
      const updatedContribution = await prisma.contribution.update({
        where: { id },
        data: updateContributionDto,
      })

      // If amount changed, update the goal's current amount
      if (oldAmount.toString() !== updatedContribution.amount.toString()) {
        const goal = await prisma.goal.findUnique({
          where: { id: contribution.goalId },
        })

        if (!goal) {
          throw new NotFoundException(
            `Goal with ID ${contribution.goalId} not found`,
          )
        }

        // Calculate the difference in amount
        const amountDifference =
          updatedContribution.amount.toNumber() - oldAmount.toNumber()

        // Calculate new current amount
        const newCurrentAmount =
          goal.currentAmount.toNumber() + amountDifference

        // Prepare update data
        const updateData: Prisma.GoalUpdateInput = {
          currentAmount: newCurrentAmount,
          needsRecalculation: true,
        }

        // Check if goal status needs to change
        if (
          newCurrentAmount >= goal.targetAmount.toNumber() &&
          goal.status === 'active'
        ) {
          updateData.status = 'completed'

          // Create achievement for completion
          await this.createAchievement(
            prisma,
            goal.id,
            'goal_completed',
            `¡Felicitaciones! Has alcanzado tu meta "${goal.name}" con éxito.`,
          )
        } else if (
          newCurrentAmount < goal.targetAmount.toNumber() &&
          goal.status === 'completed'
        ) {
          // If goal was previously completed but now it's not
          updateData.status = 'active'
        }

        // Update goal with new data
        await prisma.goal.update({
          where: { id: goal.id },
          data: updateData,
        })

        // Check milestones based on new amount
        await this.checkMilestones(prisma, {
          ...goal,
          currentAmount: new Prisma.Decimal(newCurrentAmount),
        })

        // Update suggestions
        await this.updateSuggestions(prisma, goal, newCurrentAmount)
      }

      return updatedContribution
    })
  }

  async remove(id: number) {
    const contribution = await this.findOne(id)

    return this.prisma.$transaction(async (prisma) => {
      const goal = await prisma.goal.findUnique({
        where: { id: contribution.goalId },
      })

      if (!goal) {
        throw new NotFoundException(
          `Goal with ID ${contribution.goalId} not found`,
        )
      }

      // Calculate new current amount
      const newCurrentAmount =
        goal.currentAmount.toNumber() - contribution.amount.toNumber()

      // Ensure current amount doesn't go below 0
      if (newCurrentAmount < 0) {
        throw new BadRequestException(
          'Cannot remove contribution. Current amount cannot be negative.',
        )
      }

      // Prepare update data
      const updateData: Prisma.GoalUpdateInput = {
        currentAmount: newCurrentAmount,
        needsRecalculation: true,
      }

      // Check if goal status needs to change
      if (
        goal.status === 'completed' &&
        newCurrentAmount < goal.targetAmount.toNumber()
      ) {
        updateData.status = 'active'
      }

      // Find the latest contribution date after removal
      const latestContribution = await prisma.contribution.findFirst({
        where: {
          goalId: goal.id,
          id: { not: contribution.id },
        },
        orderBy: { contributionDate: 'desc' },
      })

      if (latestContribution) {
        updateData.lastContributionDate = latestContribution.contributionDate
      } else {
        updateData.lastContributionDate = null
      }

      // Update goal with new data
      await prisma.goal.update({
        where: { id: goal.id },
        data: updateData,
      })

      // Create achievement for removal
      await this.createAchievement(
        prisma,
        goal.id,
        'on_track',
        `Has eliminado una contribución de $${contribution.amount.toString()}.`,
      )

      // Update suggestions
      await this.updateSuggestions(prisma, goal, newCurrentAmount)

      // Delete the contribution
      return prisma.contribution.delete({
        where: { id },
      })
    })
  }

  // Helper methods
  private async updateSuggestions(
    prisma: Prisma.TransactionClient,
    goal: Goal,
    newCurrentAmount: number,
  ) {
    // If goal is completed, no need for suggestions
    if (newCurrentAmount >= goal.targetAmount.toNumber()) {
      await prisma.suggestion.updateMany({
        where: { goalId: goal.id, isActive: true },
        data: { isActive: false },
      })
      return
    }

    // Calculate remaining amount and weeks
    const remainingAmount = goal.targetAmount.toNumber() - newCurrentAmount
    const currentDate = new Date()
    const deadline = new Date(goal.deadline)
    const msPerWeek = 1000 * 60 * 60 * 24 * 7
    const weeksLeft = Math.max(
      1,
      Math.ceil((deadline.getTime() - currentDate.getTime()) / msPerWeek),
    )
    const newWeeklyTarget = remainingAmount / weeksLeft

    // Update existing suggestions
    await prisma.suggestion.updateMany({
      where: { goalId: goal.id, isActive: true },
      data: { isActive: false },
    })

    // Create new suggestion
    await prisma.suggestion.create({
      data: {
        goalId: goal.id,
        message: `Para alcanzar tu meta a tiempo, deberías ahorrar $${newWeeklyTarget.toFixed(2)} por semana.`,
        suggestedAmount: newWeeklyTarget,
        frequency: 'weekly',
        isActive: true,
      },
    })
  }

  // Milestone tracking
  private async checkMilestones(prisma: Prisma.TransactionClient, goal: Goal) {
    const progressPercentage =
      (goal.currentAmount.toNumber() / goal.targetAmount.toNumber()) * 100

    // Milestone checks
    const milestones = [
      {
        threshold: 25,
        type: 'milestone_25',
        message: '¡Has alcanzado el 25% de tu meta "{goalName}"! Sigue así.',
      },
      {
        threshold: 50,
        type: 'milestone_50',
        message:
          '¡Vas por la mitad! Has alcanzado el 50% de tu meta "{goalName}".',
      },
      {
        threshold: 75,
        type: 'milestone_75',
        message:
          '¡Casi lo logras! Has alcanzado el 75% de tu meta "{goalName}".',
      },
    ]

    for (const milestone of milestones) {
      // Only check milestone if progress is at or above threshold
      if (progressPercentage >= milestone.threshold) {
        const existingAchievement = await prisma.achievement.findFirst({
          where: {
            goalId: goal.id,
            type: milestone.type as
              | 'milestone_25'
              | 'milestone_50'
              | 'milestone_75',
          },
        })

        if (!existingAchievement) {
          await this.createAchievement(
            prisma,
            goal.id,
            milestone.type as 'milestone_25' | 'milestone_50' | 'milestone_75',
            milestone.message.replace('{goalName}', goal.name),
          )
        }
      }
    }
  }

  // Weekly target recalculation
  async recalculateWeeklyTargets() {
    // Find goals that need recalculation
    const goalsToRecalculate = await this.prisma.goal.findMany({
      where: {
        status: 'active',
        needsRecalculation: true,
      },
    })

    for (const goal of goalsToRecalculate) {
      await this.recalculateGoalWeeklyTarget(goal)
    }
  }

  private async recalculateGoalWeeklyTarget(goal: Goal) {
    // Calculate remaining amount to reach target
    const remainingAmount = Math.max(
      0,
      goal.targetAmount.toNumber() - goal.currentAmount.toNumber(),
    )

    if (remainingAmount <= 0) {
      // Goal already reached, no need for weekly target
      await this.prisma.goal.update({
        where: { id: goal.id },
        data: {
          currentWeeklyTarget: 0,
          needsRecalculation: false,
          lastRecalculationDate: new Date(),
        },
      })
      return
    }

    // Calculate weeks left until deadline
    const currentDate = new Date()
    const deadline = new Date(goal.deadline)
    const msPerWeek = 1000 * 60 * 60 * 24 * 7
    const weeksLeft = Math.max(
      1,
      Math.ceil((deadline.getTime() - currentDate.getTime()) / msPerWeek),
    )

    // Calculate new weekly target
    const newWeeklyTarget = remainingAmount / weeksLeft

    await this.prisma.goal.update({
      where: { id: goal.id },
      data: {
        currentWeeklyTarget: newWeeklyTarget,
        needsRecalculation: false,
        lastRecalculationDate: new Date(),
      },
    })
  }

  // Inactivity detection
  async detectInactiveGoals(daysThreshold: number = 14) {
    const dateThreshold = new Date()
    dateThreshold.setDate(dateThreshold.getDate() - daysThreshold)

    // Find active goals with no contributions in the last X days
    const inactiveGoals = await this.prisma.goal.findMany({
      where: {
        status: 'active',
        lastContributionDate: {
          lt: dateThreshold,
        },
      },
    })

    for (const goal of inactiveGoals) {
      // Mark goal as at risk if not already
      if (!goal.isAtRisk) {
        await this.prisma.goal.update({
          where: { id: goal.id },
          data: { isAtRisk: true },
        })

        // Create an inactivity reminder
        await this.createInactivityReminder(goal.id)
      }
    }
  }

  private async createInactivityReminder(goalId: number) {
    const reminderDate = new Date()
    reminderDate.setDate(reminderDate.getDate() + 1) // Send reminder tomorrow

    await this.prisma.reminder.create({
      data: {
        scheduledDate: reminderDate,
        wasSent: false,
        reminderType: 'inactivity',
        goalId,
      },
    })
  }

  // Achievement creation
  private async createAchievement(
    prisma: Prisma.TransactionClient,
    goalId: number,
    type:
      | 'goal_completed'
      | 'milestone_25'
      | 'milestone_50'
      | 'milestone_75'
      | 'on_track'
      | 'first_contribution',
    message: string,
  ) {
    // Check if achievement of this type already exists for this goal
    if (type !== 'on_track') {
      const existingAchievement = await prisma.achievement.findFirst({
        where: {
          goalId,
          type,
        },
      })

      if (existingAchievement) {
        return // Skip creation if achievement already exists
      }
    }

    await prisma.achievement.create({
      data: {
        goalId,
        type,
        message,
        isRead: false,
        createdAt: new Date(),
      },
    })
  }
}
