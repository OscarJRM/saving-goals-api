import { Prisma } from 'generated/prisma';

export const people: Prisma.PersonCreateManyInput[] = [
  {
    firstName: 'Daniel',
    firstSurname: 'Zhu',
    email: 'dzhu2409@gmail.com',
    identification: '0707047643',
  },
  {
    firstName: 'Juan',
    firstSurname: 'Perez',
    email: 'juanperez@mail.com',
    identification: '0703224345',
  },
  {
    firstName: 'Maria',
    firstSurname: 'Gonzalez',
    email: 'maria@mail.com',
    identification: '0703224337',
  },
];
