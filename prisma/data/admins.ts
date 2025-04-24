import { Prisma } from '@prisma/client'
import * as bcrypt from 'bcrypt'

const encryptPassword = (password: string) => {
  return bcrypt.hashSync(password, 12)
}

export const admins: Prisma.AdminCreateManyInput[] = [
  {
    name: 'Daniel',
    lastName: 'Zhu',
    email: 'dzhu2409@test.org',
    password: encryptPassword('123456'),
  },
]
