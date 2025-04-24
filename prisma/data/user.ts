import * as bcrypt from 'bcrypt';
import { Prisma } from 'generated/prisma';

const encryptPassword = (password: string) => {
  return bcrypt.hashSync(password, 12);
};

export const users: Prisma.UserCreateManyInput[] = [
  {
    username: 'chu2409',
    password: encryptPassword('123456'),
    personId: 1,
  },
];
