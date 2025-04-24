import { Logger } from '@nestjs/common';
import { people } from './data/people';
import { users } from './data/user';
import { PrismaClient } from 'generated/prisma';

const prisma = new PrismaClient();

const main = async () => {
  await prisma.person.createMany({
    data: people,
  });

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
