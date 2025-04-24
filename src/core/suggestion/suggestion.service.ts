import { Injectable } from '@nestjs/common'
import { Suggestion } from '@prisma/client'
import { PrismaService } from 'src/global/prisma/prisma.service'

@Injectable()
export class SuggestionService {
  constructor(private prisma: PrismaService) {}

  findAllByGoal(goalId: number): Promise<Suggestion[]> {
    return this.prisma.suggestion.findMany({
      where: {
        goalId,
      },
    })
  }
}
