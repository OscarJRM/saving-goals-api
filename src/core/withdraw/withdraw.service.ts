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
  async findAll() {
    return await this.prisma.withdrawal.findMany({
      include: {
        goal: true,
      },
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
      // Create the withdrawal
      const withdrawal = await prisma.withdrawal.create({
        data: {
          amount: createWithdrawalDto.amount,
          withdrawalDate: createWithdrawalDto.withdrawalDate || new Date(),
          notes: createWithdrawalDto.notes,
          goal: {
            connect: { id: createWithdrawalDto.goalId },
          },
        },
      })

      console.log('Withdrawal created:', typeof withdrawal)

      // Update goal's current amount
      await this.updateGoalAfterWithdrawal(prisma, goal, withdrawal.amount)

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

      return withdrawal
    })
  }

  async update(id: number, updateWithdrawalDto: UpdateWithdrawDto) {
    const withdrawal = await this.findOne(id)
    const oldAmount = withdrawal.amount

    return this.prisma.$transaction(async (prisma) => {
      // Update withdrawal
      const updatedWithdrawal = await prisma.withdrawal.update({
        where: { id },
        data: updateWithdrawalDto,
      })

      // If amount changed, update the goal's current amount
      if (oldAmount.toString() !== updatedWithdrawal.amount.toString()) {
        const goal = await prisma.goal.findUnique({
          where: { id: withdrawal.goalId },
        })

        if (goal) {
          // Calculate the difference in withdrawal amount
          const amountDifference =
            updatedWithdrawal.amount.toNumber() - oldAmount.toNumber()

          // If the new withdrawal amount is higher, make sure there's enough balance
          if (
            amountDifference > 0 &&
            amountDifference > goal.currentAmount.toNumber()
          ) {
            throw new BadRequestException(
              'Increased withdrawal amount exceeds current goal balance',
            )
          }

          // Adjust the goal amount by the negative difference (opposite of contribution)
          await this.updateGoalAfterWithdrawalUpdate(
            prisma,
            goal,
            amountDifference,
          )
        }
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

      // Update the goal's current amount by adding back the withdrawal amount
      await this.updateGoalAfterWithdrawalRemoval(
        prisma,
        goal,
        withdrawal.amount,
      )

      // Delete the withdrawal
      return prisma.withdrawal.delete({
        where: { id },
      })
    })
  }

  // Helper methods for goal updates
  private async updateGoalAfterWithdrawal(
    prisma: Prisma.TransactionClient,
    goal: Goal,
    withdrawalAmount: Prisma.Decimal,
  ) {
    // Calculate new current amount (decrease because it's a withdrawal)
    const newCurrentAmount =
      goal.currentAmount.toNumber() - withdrawalAmount.toNumber()

    // Update goal data
    const updateData: Prisma.GoalUpdateInput = {
      currentAmount: newCurrentAmount,
      needsRecalculation: true, // Flag for recalculation
    }

    // If goal was completed but now has less than target amount, change status back to active
    if (
      goal.status === 'completed' &&
      newCurrentAmount < goal.targetAmount.toNumber()
    ) {
      updateData.status = 'active'
    }

    await prisma.goal.update({
      where: { id: goal.id },
      data: updateData,
    })
  }

  private async updateGoalAfterWithdrawalUpdate(
    prisma: Prisma.TransactionClient,
    goal: Goal,
    amountDifference: number,
  ) {
    // Calculate new current amount (decrease by difference)
    const newCurrentAmount = goal.currentAmount.toNumber() - amountDifference

    // Update goal data
    const updateData: Prisma.GoalUpdateInput = {
      currentAmount: newCurrentAmount,
      needsRecalculation: true,
    }

    // Check if goal status needs to change after update
    if (
      goal.status === 'completed' &&
      newCurrentAmount < goal.targetAmount.toNumber()
    ) {
      updateData.status = 'active'
    }

    await prisma.goal.update({
      where: { id: goal.id },
      data: updateData,
    })
  }

  private async updateGoalAfterWithdrawalRemoval(
    prisma: Prisma.TransactionClient,
    goal: Goal,
    withdrawalAmount: Prisma.Decimal,
  ) {
    // Calculate new current amount (increase because we're removing a withdrawal)
    const newCurrentAmount =
      goal.currentAmount.toNumber() + withdrawalAmount.toNumber()

    // Prepare update data
    const updateData: Prisma.GoalUpdateInput = {
      currentAmount: newCurrentAmount,
      needsRecalculation: true,
    }

    // If goal is now meeting the target amount, update status to completed
    if (
      goal.status === 'active' &&
      newCurrentAmount >= goal.targetAmount.toNumber()
    ) {
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

  // Achievement tracking
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
