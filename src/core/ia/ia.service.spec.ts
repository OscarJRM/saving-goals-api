import { Test, TestingModule } from '@nestjs/testing'
import { OpenRouterService } from './ia.service'

describe('IaService', () => {
  let service: OpenRouterService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OpenRouterService],
    }).compile()

    service = module.get<OpenRouterService>(OpenRouterService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
