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
  async findAll() {
    return this.prisma.contribution.findMany({
      include: {
        goal: true,
      },
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
    // Find the associated goal
    const goal = await this.prisma.goal.findUnique({
      where: { id: createContributionDto.goal_id },
    })

    if (!goal) {
      throw new NotFoundException(
        `Goal with ID ${createContributionDto.goal_id} not found`,
      )
    }

    if (goal.status !== 'active') {
      throw new BadRequestException(
        `Cannot add contributions to a ${goal.status} goal`,
      )
    }

    // Use transaction to ensure data consistency
    return this.prisma.$transaction(async (prisma) => {
      // Create the contribution
      const contribution = await prisma.contribution.create({
        data: {
          ...createContributionDto,
          goal: {
            connect: { id: createContributionDto.goal_id },
          },
        },
      })

      // Update goal's current amount and last contribution date
      await this.updateGoalAfterContribution(prisma, goal, contribution.amount)

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

      // Check milestones
      await this.checkMilestones(prisma, goal)

      return contribution
    })
  }

  async update(id: number, updateContributionDto: UpdateContributionDto) {
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

        if (goal) {
          // Adjust the goal amount by the difference
          const amountDifference =
            updatedContribution.amount.toNumber() - oldAmount.toNumber()
          await this.updateGoalAfterContributionUpdate(
            prisma,
            goal,
            amountDifference,
          )
        }
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

      // Update the goal's current amount by subtracting the contribution amount
      await this.updateGoalAfterContributionRemoval(
        prisma,
        goal,
        contribution.amount,
      )

      // Delete the contribution
      return prisma.contribution.delete({
        where: { id },
      })
    })
  }

  // Helper methods for goal updates
  private async updateGoalAfterContribution(
    prisma: Prisma.TransactionClient,
    goal: Goal,
    contributionAmount: Prisma.Decimal,
  ) {
    // Calculate new current amount
    const newCurrentAmount =
      goal.currentAmount.toNumber() + contributionAmount.toNumber()

    // Update goal data
    const updateData: Prisma.GoalUpdateInput = {
      currentAmount: newCurrentAmount,
      lastContributionDate: new Date(),
      isAtRisk: false, // Reset risk status after contribution
      needsRecalculation: true, // Flag for recalculation
    }

    // Check if goal is completed
    if (newCurrentAmount >= goal.targetAmount.toNumber()) {
      updateData.status = 'completed'

      await this.createAchievement(
        prisma,
        goal.id,
        'goal_completed',
        `¡Felicitaciones! Has alcanzado tu meta "${goal.name}" con éxito.`,
      )
    }

    await prisma.goal.update({
      where: { id: goal.id },
      data: updateData,
    })
  }

  private async updateGoalAfterContributionUpdate(
    prisma: Prisma.TransactionClient,
    goal: Goal,
    amountDifference: number,
  ) {
    // Calculate new current amount
    const newCurrentAmount = goal.currentAmount.toNumber() + amountDifference

    // Update goal data
    const updateData: Prisma.GoalUpdateInput = {
      currentAmount: newCurrentAmount,
      needsRecalculation: true,
    }

    // Check if goal is completed after update
    if (
      newCurrentAmount >= goal.targetAmount.toNumber() &&
      goal.status === 'active'
    ) {
      updateData.status = 'completed'

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
      // If the goal was previously completed but now it's not
      updateData.status = 'active'
    }

    await prisma.goal.update({
      where: { id: goal.id },
      data: updateData,
    })
  }

  private async updateGoalAfterContributionRemoval(
    prisma: Prisma.TransactionClient,
    goal: Goal,
    contributionAmount: Prisma.Decimal,
  ) {
    // Calculate new current amount
    let newCurrentAmount =
      goal.currentAmount.toNumber() - contributionAmount.toNumber()

    // Ensure current_amount doesn't go below 0
    if (newCurrentAmount < 0) {
      newCurrentAmount = 0
    }

    // Prepare update data
    const updateData: Prisma.GoalUpdateInput = {
      currentAmount: newCurrentAmount,
      needsRecalculation: true,
    }

    // If goal was completed but now it's not
    if (
      goal.status === 'completed' &&
      newCurrentAmount < goal.targetAmount.toNumber()
    ) {
      updateData.status = 'active'
    }

    // Find the latest contribution date
    const latestContribution = await prisma.contribution.findFirst({
      where: { id: goal.id },
      orderBy: { contributionDate: 'desc' },
    })

    if (latestContribution) {
      updateData.lastContributionDate = latestContribution.contributionDate
    } else {
      updateData.lastContributionDate = null
    }

    await prisma.goal.update({
      where: { id: goal.id },
      data: updateData,
    })
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
    const remainingAmount =
      goal.targetAmount.toNumber() - goal.currentAmount.toNumber()

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

  // Achievement tracking
  private async checkMilestones(prisma: Prisma.TransactionClient, goal: Goal) {
    const progressPercentage =
      (goal.currentAmount.toNumber() / goal.targetAmount.toNumber()) * 100

    // Check 25% milestone
    if (progressPercentage >= 25 && progressPercentage < 50) {
      const existingAchievement = await prisma.achievement.findFirst({
        where: {
          goalId: goal.id,
          type: 'milestone_25',
        },
      })

      if (!existingAchievement) {
        await this.createAchievement(
          prisma,
          goal.id,
          'milestone_25',
          `¡Has alcanzado el 25% de tu meta "${goal.name}"! Sigue así.`,
        )
      }
    }

    // Check 50% milestone
    if (progressPercentage >= 50 && progressPercentage < 75) {
      const existingAchievement = await prisma.achievement.findFirst({
        where: {
          goalId: goal.id,
          type: 'milestone_50',
        },
      })

      if (!existingAchievement) {
        await this.createAchievement(
          prisma,
          goal.id,
          'milestone_50',
          `¡Vas por la mitad! Has alcanzado el 50% de tu meta "${goal.name}".`,
        )
      }
    }

    // Check 75% milestone
    if (progressPercentage >= 75 && progressPercentage < 100) {
      const existingAchievement = await prisma.achievement.findFirst({
        where: {
          goalId: goal.id,
          type: 'milestone_75',
        },
      })

      if (!existingAchievement) {
        await this.createAchievement(
          prisma,
          goal.id,
          'milestone_75',
          `¡Casi lo logras! Has alcanzado el 75% de tu meta "${goal.name}".`,
        )
      }
    }
  }

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
    await prisma.achievement.create({
      data: {
        goalId,
        type,
        message,
        isRead: false,
      },
    })
  }
}
