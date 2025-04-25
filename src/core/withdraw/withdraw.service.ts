import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common'
import { Goal, Prisma } from '@prisma/client'
import { PrismaService } from 'src/global/prisma/prisma.service'
import { CreateWithdrawDto } from './dto/create-withdraw.dto'
import { UpdateWithdrawDto } from './dto/update-withdraw.dto'

@Injectable()
export class WithdrawService {
  constructor(private prisma: PrismaService) {}

  // CRUD Operations
  async findAll(userId: number) {
    return await this.prisma.withdrawal.findMany({
      where: {
        goal: {
          userId,
        },
      },
      include: {
        goal: true,
      },
      orderBy: { withdrawalDate: 'desc' },
    })
  }

  async findByGoal(goalId: number) {
    return await this.prisma.withdrawal.findMany({
      where: { goalId },
      orderBy: { withdrawalDate: 'desc' },
    })
  }

  async findOne(id: number) {
    const withdrawal = await this.prisma.withdrawal.findUnique({
      where: { id },
      include: { goal: true },
    })

    if (!withdrawal) {
      throw new NotFoundException(`Withdrawal with ID ${id} not found`)
    }

    return withdrawal
  }

  async create(createWithdrawalDto: CreateWithdrawDto) {
    // Validate withdrawal amount is positive
    if (createWithdrawalDto.amount <= 0) {
      throw new BadRequestException('Withdrawal amount must be greater than 0')
    }
    // Find the associated goal
    const goal = await this.prisma.goal.findUnique({
      where: { id: createWithdrawalDto.goalId },
    })
    if (!goal) {
      throw new NotFoundException(
        `Goal with ID ${createWithdrawalDto.goalId} not found`,
      )
    }
    if (goal.status !== 'active' && goal.status !== 'completed') {
      throw new BadRequestException(
        `Cannot withdraw from a ${goal.status} goal`,
      )
    }
    // Validate withdrawal amount
    if (createWithdrawalDto.amount > goal.currentAmount.toNumber()) {
      throw new BadRequestException(
        `Withdrawal amount exceeds current goal balance of ${goal.currentAmount.toString()}`,
      )
    }
    // Use transaction to ensure data consistency
    return this.prisma.$transaction(async (prisma) => {
      // Create the withdrawal with validated date
      const withdrawal = await prisma.withdrawal.create({
        data: {
          amount: createWithdrawalDto.amount,
          withdrawalDate: createWithdrawalDto.withdrawalDate || new Date(),
          notes: createWithdrawalDto.notes || '',
          goal: {
            connect: { id: createWithdrawalDto.goalId },
          },
        },
      })
      // Calculate new current amount after withdrawal
      const newCurrentAmount =
        goal.currentAmount.toNumber() - withdrawal.amount.toNumber()
      // Prepare goal update data
      const updateData: Prisma.GoalUpdateInput = {
        currentAmount: newCurrentAmount,
        needsRecalculation: true, // Flag for recalculation
      }
      // Update goal status if needed
      if (
        goal.status === 'completed' &&
        newCurrentAmount < goal.targetAmount.toNumber()
      ) {
        updateData.status = 'active' // Goal is no longer completed
      }
      // Update the goal
      await prisma.goal.update({
        where: { id: goal.id },
        data: updateData,
      })
      // Check if this is the first withdrawal to create achievement
      const withdrawalCount = await prisma.withdrawal.count({
        where: { goalId: goal.id },
      })
      if (withdrawalCount === 1) {
        await this.createAchievement(
          prisma,
          goal.id,
          'first_withdrawal',
          `Has realizado tu primer retiro de la meta "${goal.name}".`,
        )
      }
      // Calculate new weekly target after withdrawal
      const remainingAmount = goal.targetAmount.toNumber() - newCurrentAmount
      const currentDate = new Date()
      const deadline = new Date(goal.deadline)
      const msPerWeek = 1000 * 60 * 60 * 24 * 7
      const weeksLeft = Math.max(
        1,
        Math.ceil((deadline.getTime() - currentDate.getTime()) / msPerWeek),
      )
      const newWeeklyTarget = remainingAmount / weeksLeft
      // Update suggestions
      await prisma.suggestion.updateMany({
        where: { goalId: goal.id, isActive: true },
        data: { isActive: false },
      })
      // Create new suggestion with updated target
      await prisma.suggestion.create({
        data: {
          goalId: goal.id,
          message: `Después de tu retiro, para alcanzar tu meta a tiempo, deberías ahorrar $${newWeeklyTarget.toFixed(2)} por semana.`,
          suggestedAmount: newWeeklyTarget,
          frequency: 'weekly',
          isActive: true,
        },
      })
      return withdrawal
    })
  }

  async update(id: number, updateWithdrawalDto: UpdateWithdrawDto) {
    // Validate amount if provided
    if (
      updateWithdrawalDto.amount !== undefined &&
      updateWithdrawalDto.amount <= 0
    ) {
      throw new BadRequestException('Withdrawal amount must be greater than 0')
    }

    const withdrawal = await this.findOne(id)
    const oldAmount = withdrawal.amount

    return this.prisma.$transaction(async (prisma) => {
      // Get the goal first to validate changes
      const goal = await prisma.goal.findUnique({
        where: { id: withdrawal.goalId },
      })

      if (!goal) {
        throw new NotFoundException(
          `Goal with ID ${withdrawal.goalId} not found`,
        )
      }

      // If amount is changing, check if new amount is valid
      if (
        updateWithdrawalDto.amount &&
        updateWithdrawalDto.amount !== oldAmount.toNumber()
      ) {
        const amountDifference =
          updateWithdrawalDto.amount - oldAmount.toNumber()

        // If increasing withdrawal amount, verify there's enough balance
        if (
          amountDifference > 0 &&
          amountDifference > goal.currentAmount.toNumber()
        ) {
          throw new BadRequestException(
            'Increased withdrawal amount exceeds current goal balance',
          )
        }
      }

      // Update withdrawal
      const updatedWithdrawal = await prisma.withdrawal.update({
        where: { id },
        data: updateWithdrawalDto,
      })

      // If amount changed, update the goal's current amount
      if (oldAmount.toString() !== updatedWithdrawal.amount.toString()) {
        // Calculate the difference in withdrawal amount
        const amountDifference =
          updatedWithdrawal.amount.toNumber() - oldAmount.toNumber()

        // Calculate new current amount
        const newCurrentAmount =
          goal.currentAmount.toNumber() - amountDifference

        // Prepare update data
        const updateData: Prisma.GoalUpdateInput = {
          currentAmount: newCurrentAmount,
          needsRecalculation: true,
        }

        // Update goal status if needed
        if (
          goal.status === 'completed' &&
          newCurrentAmount < goal.targetAmount.toNumber()
        ) {
          updateData.status = 'active' // Goal is no longer completed
        } else if (
          goal.status === 'active' &&
          newCurrentAmount >= goal.targetAmount.toNumber()
        ) {
          updateData.status = 'completed' // Goal is now completed

          // Create achievement for completion
          await this.createAchievement(
            prisma,
            goal.id,
            'goal_completed',
            `¡Felicitaciones! Has alcanzado tu meta "${goal.name}" con éxito.`,
          )
        }

        // Update the goal
        await prisma.goal.update({
          where: { id: goal.id },
          data: updateData,
        })

        // Update suggestions
        await this.updateSuggestions(prisma, goal, newCurrentAmount)
      }

      return updatedWithdrawal
    })
  }

  async remove(id: number) {
    const withdrawal = await this.findOne(id)

    return this.prisma.$transaction(async (prisma) => {
      const goal = await prisma.goal.findUnique({
        where: { id: withdrawal.goalId },
      })

      if (!goal) {
        throw new NotFoundException(
          `Goal with ID ${withdrawal.goalId} not found`,
        )
      }

      // Calculate new current amount after removing the withdrawal
      const newCurrentAmount =
        goal.currentAmount.toNumber() + withdrawal.amount.toNumber()

      // Prepare update data
      const updateData: Prisma.GoalUpdateInput = {
        currentAmount: newCurrentAmount,
        needsRecalculation: true,
      }

      // Check if goal status needs to change
      if (
        goal.status === 'active' &&
        newCurrentAmount >= goal.targetAmount.toNumber()
      ) {
        updateData.status = 'completed'

        // Create achievement for completion
        await this.createAchievement(
          prisma,
          goal.id,
          'goal_completed',
          `¡Felicitaciones! Has alcanzado tu meta "${goal.name}" con éxito.`,
        )
      }

      // Update the goal
      await prisma.goal.update({
        where: { id: goal.id },
        data: updateData,
      })

      // Create an achievement for the removal
      await this.createAchievement(
        prisma,
        goal.id,
        'on_track',
        `Has eliminado un retiro de $${withdrawal.amount.toString()}.`,
      )

      // Update suggestions
      await this.updateSuggestions(prisma, goal, newCurrentAmount)

      // Delete the withdrawal
      return prisma.withdrawal.delete({
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
    // Deactivate current suggestions
    await prisma.suggestion.updateMany({
      where: { goalId: goal.id, isActive: true },
      data: { isActive: false },
    })

    // If goal is completed, no need to create new suggestion
    if (newCurrentAmount >= goal.targetAmount.toNumber()) {
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
      | 'first_withdrawal',
    message: string,
  ) {
    // Check if achievement of this type already exists (except for on_track type)
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
