import { Logger } from '@nestjs/common'
import { users } from './data/users'
import { PrismaClient } from '@prisma/client'
import { categories } from './data/categories'
import { admins } from './data/admins'

const prisma = new PrismaClient()

const main = async () => {
  await prisma.user.createMany({
    data: users,
  })

  await prisma.admin.createMany({
    data: admins,
  })

  await prisma.category.createMany({
    data: categories,
  })

  Logger.log('Seed data created successfully')
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
