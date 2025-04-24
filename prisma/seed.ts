import { Logger } from '@nestjs/common';
import { users } from './data/user';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const main = async () => {

  await prisma.user.createMany({
    data: users,
  });

  Logger.log('Seed data created successfully');
};

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    Logger.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
