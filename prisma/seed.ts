import { Logger } from '@nestjs/common'
import { Contribution, PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Crear usuario
  const user = await prisma.user.create({
    data: {
      firstName: 'Juan',
      lastName: 'Pérez',
      email: 'juan.perez@example.com',
      passwordHash:
        '$2a$10$N9qo8uLOickgx2ZMRZoMy.MQRqQ8q1F5eYdLYy5z6dRA4CQZ7ZJdK', // "password123" hasheado
      profilePicture: 'https://randomuser.me/api/portraits/men/1.jpg',
      gender: 'Masculino',
      birthDate: new Date('1990-05-15'),
    },
  })

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
  })

  // Obtener categorías para usarlas en las metas
  const travelCategory = await prisma.category.findUnique({
    where: { name: 'Viajes' },
  })
  const educationCategory = await prisma.category.findUnique({
    where: { name: 'Educación' },
  })
  const emergencyCategory = await prisma.category.findUnique({
    where: { name: 'Emergencias' },
  })

  // Crear metas para el usuario
  const goals = await Promise.all([
    prisma.goal.create({
      data: {
        userId: user.id,
        categoryId: travelCategory!.id,
        name: 'Viaje a Europa',
        targetAmount: 5000.0,
        deadline: new Date('2024-06-01'),
        initialWeeklyTarget: 200.0,
        currentWeeklyTarget: 200.0,
        currentAmount: 1200.0,
        isAtRisk: false,
      },
    }),
    prisma.goal.create({
      data: {
        userId: user.id,
        categoryId: educationCategory!.id,
        name: 'Maestría en Administración',
        targetAmount: 8000.0,
        deadline: new Date('2024-09-15'),
        initialWeeklyTarget: 250.0,
        currentWeeklyTarget: 250.0,
        currentAmount: 3000.0,
        isAtRisk: true,
      },
    }),
    prisma.goal.create({
      data: {
        userId: user.id,
        categoryId: emergencyCategory!.id,
        name: 'Fondo de emergencia',
        targetAmount: 10000.0,
        deadline: new Date('2025-12-31'),
        initialWeeklyTarget: 100.0,
        currentWeeklyTarget: 100.0,
        currentAmount: 2500.0,
        isAtRisk: false,
      },
    }),
  ])

  // Función para generar fechas aleatorias en un rango
  function randomDate(start: Date, end: Date) {
    return new Date(
      start.getTime() + Math.random() * (end.getTime() - start.getTime()),
    )
  }

  // Crear contribuciones para cada meta
  const contributions: Contribution[] = []

  // Contribuciones para el viaje a Europa (meta 1)
  for (let i = 0; i < 8; i++) {
    contributions.push(
      await prisma.contribution.create({
        data: {
          goalId: goals[0].id,
          amount: Math.random() > 0.3 ? 200.0 : 150.0 + Math.random() * 100, // 70% chance de 200, 30% de 150-250
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

  // Contribuciones para la maestría (meta 2)
  for (let i = 0; i < 7; i++) {
    contributions.push(
      await prisma.contribution.create({
        data: {
          goalId: goals[1].id,
          amount: Math.random() > 0.4 ? 250.0 : 200.0 + Math.random() * 100, // 60% chance de 250, 40% de 200-300
          contributionDate: randomDate(new Date('2023-02-15'), new Date()),
          notes: i % 2 === 0 ? 'Pago mensual' : 'Ahorro variable',
        },
      }),
    )
  }

  // Contribuciones para el fondo de emergencia (meta 3)
  for (let i = 0; i < 5; i++) {
    contributions.push(
      await prisma.contribution.create({
        data: {
          goalId: goals[2].id,
          amount: Math.random() > 0.5 ? 100.0 : 50.0 + Math.random() * 100, // 50% chance de 100, 50% de 50-150
          contributionDate: randomDate(new Date('2023-03-01'), new Date()),
          notes: i % 4 === 0 ? 'Depósito automático' : 'Transferencia manual',
        },
      }),
    )
  }

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
main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    Logger.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
