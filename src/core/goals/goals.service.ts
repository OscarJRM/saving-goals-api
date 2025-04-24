import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common'
import { CreateGoalDto } from './dto/create-goal.dto'
import { UpdateGoalDto } from './dto/update-goal.dto'
import { GoalResponseDto } from './dto/goal-response.dto'
import { FilterGoalsDto } from './dto/filter-goal.dto'
import { FinancialCalculatorService } from 'src/core/financial-calculator/financial-calculator.service'
import { Decimal } from '@prisma/client/runtime/library'
import { PrismaService } from 'src/global/prisma/prisma.service'

@Injectable()
export class GoalsService {
  constructor(
    private prisma: PrismaService,
    private financialCalculator: FinancialCalculatorService,
  ) {}

  /**
   * Crea una nueva meta de ahorro
   */
  async create(
    userId: number,
    createGoalDto: CreateGoalDto,
  ): Promise<GoalResponseDto> {
    // Verificar que la fecha límite sea en el futuro
    const currentDate = new Date()
    if (new Date(createGoalDto.deadline) <= currentDate) {
      throw new BadRequestException('La fecha límite debe ser en el futuro')
    }

    // Verificar que la categoría existe
    const category = await this.prisma.category.findUnique({
      where: { id: createGoalDto.categoryId },
    })

    if (!category) {
      throw new NotFoundException('La categoría especificada no existe')
    }

    // Calcular el objetivo semanal inicial
    const initialWeeklyTarget =
      this.financialCalculator.calculateInitialWeeklyTarget(
        createGoalDto.targetAmount,
        new Date(createGoalDto.deadline),
      )

    // Crear la meta en la base de datos
    const goal = await this.prisma.goal.create({
      data: {
        userId,
        name: createGoalDto.name,
        targetAmount: createGoalDto.targetAmount,
        deadline: new Date(createGoalDto.deadline),
        categoryId: createGoalDto.categoryId,
        initialWeeklyTarget,
        currentWeeklyTarget: initialWeeklyTarget,
        status: 'active',
      },
    })

    // Crear la primera sugerencia para la meta
    await this.prisma.suggestion.create({
      data: {
        goalId: goal.id,
        message: `Para alcanzar tu meta a tiempo, deberías ahorrar $${initialWeeklyTarget} por semana.`,
        suggestedAmount: initialWeeklyTarget,
        frequency: 'weekly',
        isActive: true,
      },
    })

    const progressNumber = this.financialCalculator.calculateProgress(
      parseFloat(goal.currentAmount.toString()),
      parseFloat(goal.targetAmount.toString()),
    )

    return new GoalResponseDto(goal, progressNumber)
  }

  /**
   * Obtiene todas las metas de un usuario, con filtros opcionales
   */
  async findAll(
    userId: number,
    filterDto?: FilterGoalsDto,
  ): Promise<GoalResponseDto[]> {
    const filter: any = { userId }

    if (filterDto?.status) {
      filter.status = filterDto.status
    }

    if (filterDto?.categoryId) {
      filter.categoryId = filterDto.categoryId
    }

    const goals = await this.prisma.goal.findMany({
      where: filter,
      orderBy: { createdAt: 'desc' },
      include: {
        category: true,
      },
    })

    const goalResponseDtos = await Promise.all(
      goals.map((goal) => {
        const progressNumber = this.financialCalculator.calculateProgress(
          parseFloat(goal.currentAmount.toString()),
          parseFloat(goal.targetAmount.toString()),
        )
        return new GoalResponseDto(goal, progressNumber)
      }),
    )
    return goalResponseDtos
  }

  /**
   * Obtiene una meta específica por ID
   */
  async findOne(userId: number, goalId: number): Promise<GoalResponseDto> {
    const goal = await this.prisma.goal.findFirst({
      where: {
        id: goalId,
        userId,
      },
      include: {
        category: true,
        contributions: {
          orderBy: { contributionDate: 'desc' },
        },
        suggestions: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    })

    if (!goal) {
      throw new NotFoundException('Meta no encontrada')
    }

    const progressNumber = this.financialCalculator.calculateProgress(
      parseFloat(goal.currentAmount.toString()),
      parseFloat(goal.targetAmount.toString()),
    )

    return new GoalResponseDto(goal, progressNumber)
  }

  /**
   * Actualiza una meta existente
   */
  async update(
    userId: number,
    goalId: number,
    updateGoalDto: UpdateGoalDto,
  ): Promise<GoalResponseDto> {
    // Verificar que la meta existe y pertenece al usuario
    const existingGoal = await this.prisma.goal.findFirst({
      where: {
        id: goalId,
        userId,
      },
    })

    if (!existingGoal) {
      throw new NotFoundException('Meta no encontrada')
    }

    // Si se está actualizando la fecha límite, verificar que sea válida
    if (
      updateGoalDto.deadline &&
      new Date(updateGoalDto.deadline) <= new Date()
    ) {
      throw new BadRequestException('La fecha límite debe ser en el futuro')
    }

    // Si se actualiza la categoría, verificar que existe
    if (updateGoalDto.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: updateGoalDto.categoryId },
      })

      if (!category) {
        throw new NotFoundException('La categoría especificada no existe')
      }
    }

    // Recalcular el objetivo semanal si es necesario
    let currentWeeklyTarget = existingGoal.currentWeeklyTarget
    if (updateGoalDto.targetAmount || updateGoalDto.deadline) {
      const targetAmount =
        updateGoalDto.targetAmount ||
        parseFloat(existingGoal.targetAmount.toString())
      const deadline = updateGoalDto.deadline
        ? new Date(updateGoalDto.deadline)
        : existingGoal.deadline

      currentWeeklyTarget = new Decimal(
        this.financialCalculator.calculateCurrentWeeklyTarget(
          targetAmount,
          parseFloat(existingGoal.currentAmount.toString()),
          deadline,
        ),
      )
    }

    // Actualizar la meta
    const updatedGoal = await this.prisma.goal.update({
      where: { id: goalId },
      data: {
        name: updateGoalDto.name,
        targetAmount: updateGoalDto.targetAmount,
        deadline: updateGoalDto.deadline
          ? new Date(updateGoalDto.deadline)
          : undefined,
        categoryId: updateGoalDto.categoryId,
        currentWeeklyTarget,
        updatedAt: new Date(),
        needsRecalculation: false,
        lastRecalculationDate: new Date(),
      },
    })

    // Desactivar sugerencias anteriores
    await this.prisma.suggestion.updateMany({
      where: { goalId },
      data: { isActive: false },
    })

    // Crear nueva sugerencia
    await this.prisma.suggestion.create({
      data: {
        goalId,
        message: `Para alcanzar tu meta a tiempo, deberías ahorrar $${currentWeeklyTarget ? currentWeeklyTarget.toString() : '0'} por semana.`,
        suggestedAmount: currentWeeklyTarget,
        frequency: 'weekly',
        isActive: true,
      },
    })

    // Actualizar si la meta está en riesgo
    const isAtRisk = this.financialCalculator.isGoalAtRisk(
      parseFloat(existingGoal.initialWeeklyTarget?.toString() || '0'),
      parseFloat(currentWeeklyTarget?.toString() || '0'),
    )

    if (isAtRisk !== existingGoal.isAtRisk) {
      await this.prisma.goal.update({
        where: { id: goalId },
        data: { isAtRisk },
      })
    }

    const progressNumber = this.financialCalculator.calculateProgress(
      parseFloat(updatedGoal.currentAmount.toString()),
      parseFloat(updatedGoal.targetAmount.toString()),
    )

    return new GoalResponseDto(updatedGoal, progressNumber)
  }

  /**
   * Elimina una meta existente
   */
  async remove(userId: number, goalId: number): Promise<void> {
    // Verificar que la meta existe y pertenece al usuario
    const existingGoal = await this.prisma.goal.findFirst({
      where: {
        id: goalId,
        userId,
      },
    })

    if (!existingGoal) {
      throw new NotFoundException('Meta no encontrada')
    }

    // Eliminar la meta (las tablas relacionadas se eliminarán automáticamente
    // gracias a la configuración ON DELETE CASCADE en la base de datos)
    await this.prisma.goal.delete({
      where: { id: goalId },
    })
  }

  /**
   * Verifica y actualiza el estado de las metas vencidas
   */
  async checkExpiredGoals(): Promise<void> {
    const currentDate = new Date()

    // Buscar metas activas con fecha límite vencida
    const expiredGoals = await this.prisma.goal.findMany({
      where: {
        status: 'active',
        deadline: {
          lt: currentDate,
        },
      },
    })

    // Actualizar el estado de las metas vencidas
    for (const goal of expiredGoals) {
      await this.prisma.goal.update({
        where: { id: goal.id },
        data: { status: 'expired' },
      })
    }
  }

  /**
   * Recalcula los objetivos semanales para todas las metas que lo necesitan
   */
  async recalculateWeeklyTargets(): Promise<void> {
    const goalsNeedingRecalculation = await this.prisma.goal.findMany({
      where: {
        status: 'active',
        needsRecalculation: true,
      },
    })

    for (const goal of goalsNeedingRecalculation) {
      const currentWeeklyTarget =
        this.financialCalculator.calculateCurrentWeeklyTarget(
          parseFloat(goal.targetAmount.toString()),
          parseFloat(goal.currentAmount.toString()),
          goal.deadline,
        )

      const isAtRisk = this.financialCalculator.isGoalAtRisk(
        parseFloat(goal.initialWeeklyTarget?.toString() || '0'),
        currentWeeklyTarget,
      )

      await this.prisma.goal.update({
        where: { id: goal.id },
        data: {
          currentWeeklyTarget,
          isAtRisk,
          needsRecalculation: false,
          lastRecalculationDate: new Date(),
        },
      })

      // Desactivar sugerencias anteriores
      await this.prisma.suggestion.updateMany({
        where: { goalId: goal.id },
        data: { isActive: false },
      })

      // Crear nueva sugerencia
      await this.prisma.suggestion.create({
        data: {
          goalId: goal.id,
          message: `Para alcanzar tu meta a tiempo, deberías ahorrar $${currentWeeklyTarget} por semana.`,
          suggestedAmount: currentWeeklyTarget,
          frequency: 'weekly',
          isActive: true,
        },
      })
    }
  }
}
