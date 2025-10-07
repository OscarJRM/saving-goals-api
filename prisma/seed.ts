import { Logger } from '@nestjs/common'
import { Contribution, PrismaClient } from '@prisma/client'
import { users } from './data/users'

const prisma = new PrismaClient()

async function main() {
  // ─────────────────────────────────────────────
  // 🧩 1. Crear usuario si no existe
  // ─────────────────────────────────────────────
  const existingUser = await prisma.user.findUnique({
    where: { email: users[0].email },
  })

  const user = existingUser
    ? existingUser
    : await prisma.user.create({
        data: users[0],
      })

  // ─────────────────────────────────────────────
  // 🧩 2. Crear categorías si no existen
  // ─────────────────────────────────────────────
  await prisma.category.createMany({
    data: [
      {
        name: 'Viajes',
        description: 'Ahorros para viajes y vacaciones',
        icon: 'airplane',
      },
      {
        name: 'Educación',
        description: 'Ahorros para educación y cursos',
        icon: 'graduation-cap',
      },
      {
        name: 'Emergencias',
        description: 'Fondo de emergencia',
        icon: 'first-aid',
      },
      {
        name: 'Automóvil',
        description: 'Ahorros para compra o mantenimiento de auto',
        icon: 'car',
      },
      {
        name: 'Hogar',
        description: 'Mejoras y reparaciones del hogar',
        icon: 'home',
      },
    ],
    skipDuplicates: true, // <-- evita duplicados si ya existen
  })

  // Obtener categorías
  const travelCategory = await prisma.category.findUnique({
    where: { name: 'Viajes' },
  })
  const educationCategory = await prisma.category.findUnique({
    where: { name: 'Educación' },
  })
  const emergencyCategory = await prisma.category.findUnique({
    where: { name: 'Emergencias' },
  })

  // ─────────────────────────────────────────────
  // 🧩 3. Crear metas solo si no existen
  // ─────────────────────────────────────────────
  async function createGoalIfNotExists(data: any) {
    const existingGoal = await prisma.goal.findFirst({
      where: { name: data.name, userId: user.id },
    })
    if (!existingGoal) {
      return prisma.goal.create({ data })
    }
    return existingGoal
  }

  const goals = await Promise.all([
    createGoalIfNotExists({
      userId: user.id,
      categoryId: travelCategory!.id,
      name: 'Viaje a Europa',
      targetAmount: 5000.0,
      deadline: new Date('2024-06-01'),
      initialWeeklyTarget: 200.0,
      currentWeeklyTarget: 200.0,
      currentAmount: 1200.0,
      isAtRisk: false,
    }),
    createGoalIfNotExists({
      userId: user.id,
      categoryId: educationCategory!.id,
      name: 'Maestría en Administración',
      targetAmount: 8000.0,
      deadline: new Date('2024-09-15'),
      initialWeeklyTarget: 250.0,
      currentWeeklyTarget: 250.0,
      currentAmount: 3000.0,
      isAtRisk: true,
    }),
    createGoalIfNotExists({
      userId: user.id,
      categoryId: emergencyCategory!.id,
      name: 'Fondo de emergencia',
      targetAmount: 10000.0,
      deadline: new Date('2025-12-31'),
      initialWeeklyTarget: 100.0,
      currentWeeklyTarget: 100.0,
      currentAmount: 2500.0,
      isAtRisk: false,
    }),
  ])

  // ─────────────────────────────────────────────
  // 🧩 4. Crear contribuciones, retiros, recordatorios, etc. solo si no existen
  // ─────────────────────────────────────────────

  // Generador de fechas aleatorias
  function randomDate(start: Date, end: Date) {
    return new Date(
      start.getTime() + Math.random() * (end.getTime() - start.getTime()),
    )
  }

  // Evitar repetir si ya existen contribuciones
  const existingContributions = await prisma.contribution.findMany({
    where: { goalId: goals[0].id },
  })
  if (existingContributions.length === 0) {
    const contributions: Contribution[] = []

    // Contribuciones para el viaje a Europa
    for (let i = 0; i < 8; i++) {
      contributions.push(
        await prisma.contribution.create({
          data: {
            goalId: goals[0].id,
            amount:
              Math.random() > 0.3 ? 200.0 : 150.0 + Math.random() * 100,
            contributionDate: randomDate(new Date('2023-01-01'), new Date()),
            notes:
              i % 3 === 0
                ? 'Depósito quincenal'
                : i % 3 === 1
                ? 'Bono trabajo'
                : 'Ahorro extra',
          },
        }),
      )
    }

    // Maestría
    for (let i = 0; i < 7; i++) {
      contributions.push(
        await prisma.contribution.create({
          data: {
            goalId: goals[1].id,
            amount:
              Math.random() > 0.4 ? 250.0 : 200.0 + Math.random() * 100,
            contributionDate: randomDate(new Date('2023-02-15'), new Date()),
            notes: i % 2 === 0 ? 'Pago mensual' : 'Ahorro variable',
          },
        }),
      )
    }

    // Fondo de emergencia
    for (let i = 0; i < 5; i++) {
      contributions.push(
        await prisma.contribution.create({
          data: {
            goalId: goals[2].id,
            amount:
              Math.random() > 0.5 ? 100.0 : 50.0 + Math.random() * 100,
            contributionDate: randomDate(new Date('2023-03-01'), new Date()),
            notes:
              i % 4 === 0 ? 'Depósito automático' : 'Transferencia manual',
          },
        }),
      )
    }
  }

  // ─────────────────────────────────────────────
  // 🧩 5. Crear datos secundarios (retiros, recordatorios, etc.) si no existen
  // ─────────────────────────────────────────────
  const withdrawalsCount = await prisma.withdrawal.count()
  if (withdrawalsCount === 0) {
    await Promise.all([
      prisma.withdrawal.create({
        data: {
          goalId: goals[0].id,
          amount: 300.0,
          withdrawalDate: new Date('2023-05-10'),
          notes: 'Compra de boletos de avión',
        },
      }),
      prisma.withdrawal.create({
        data: {
          goalId: goals[2].id,
          amount: 500.0,
          withdrawalDate: new Date('2023-04-15'),
          notes: 'Reparación de refrigerador',
        },
      }),
    ])
  }

  const remindersCount = await prisma.reminder.count()
  if (remindersCount === 0) {
    await Promise.all([
      prisma.reminder.create({
        data: {
          goalId: goals[0].id,
          scheduledDate: new Date('2023-06-01'),
          reminderType: 'email',
        },
      }),
      prisma.reminder.create({
        data: {
          goalId: goals[1].id,
          scheduledDate: new Date('2023-05-15'),
          reminderType: 'push',
          wasSent: true,
        },
      }),
    ])
  }

  const suggestionsCount = await prisma.suggestion.count()
  if (suggestionsCount === 0) {
    await Promise.all([
      prisma.suggestion.create({
        data: {
          goalId: goals[0].id,
          message:
            'Considera aumentar tu aportación semanal a $250 para alcanzar tu meta a tiempo',
          suggestedAmount: 250.0,
          frequency: 'semanal',
        },
      }),
      prisma.suggestion.create({
        data: {
          goalId: goals[1].id,
          message:
            'Tu meta está en riesgo, te sugerimos ajustar tu frecuencia a quincenal',
          frequency: 'quincenal',
        },
      }),
    ])
  }

  const achievementsCount = await prisma.achievement.count()
  if (achievementsCount === 0) {
    await Promise.all([
      prisma.achievement.create({
        data: {
          goalId: goals[0].id,
          type: 'milestone',
          message: '¡Felicidades! Has alcanzado el 20% de tu meta de viaje',
        },
      }),
      prisma.achievement.create({
        data: {
          goalId: goals[2].id,
          type: 'consistency',
          message:
            'Has realizado aportaciones consistentes por 3 meses consecutivos',
        },
      }),
    ])
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    Logger.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
