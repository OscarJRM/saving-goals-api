import { Prisma } from '@prisma/client'
import * as bcrypt from 'bcrypt'

const encryptPassword = (password: string) => {
  return bcrypt.hashSync(password, 12)
}

export const users: Prisma.UserCreateManyInput[] = [
  {
    firstName: 'Joshua',
    lastName: 'Herrera',
    email: 'sebas.herrera3152@gmail.com',
    passwordHash: encryptPassword('123456'),
    birthDate: new Date('2003-08-11'),
    gender: 'M',
    profilePicture: 'https://randomuser.me/api/portraits',
  },
]
