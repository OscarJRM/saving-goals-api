import { Prisma } from '@prisma/client'

export const categories: Prisma.CategoryCreateManyInput[] = [
  {
    name: 'Food',
    description: 'Food and groceries',
    icon: null,
  },
  {
    name: 'Transport',
    description: 'Transport and travel',
    icon: null,
  },
  {
    name: 'Entertainment',
    description: 'Entertainment and leisure',
    icon: null,
  },
]
