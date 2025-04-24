import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common'
import { SuggestionService } from './suggestion.service'
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger'
import { SuggestionResponseDto } from './dto/suggestion-response.dto'
import { Auth } from '../auth/decorators/auth.decorator'

@Auth()
@ApiTags('Suggestion')
@ApiBearerAuth()
@Auth()
@Controller('suggestion')
export class SuggestionController {
  constructor(private readonly suggestionService: SuggestionService) {}

  @Get('goal/:goalId')
  @ApiOperation({ summary: 'Get suggestions by goal ID' })
  @ApiResponse({
    status: 200,
    description: 'List of suggestions for the specified goal',
    type: [SuggestionResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiParam({
    name: 'goalId',
    description: 'The ID of the goal to retrieve suggestions for',
    type: Number,
  })
  async findAllByGoal(
    @Param('goalId', ParseIntPipe) goalId: number,
  ): Promise<SuggestionResponseDto[]> {
    console.log('goalId', typeof goalId)

    return (await this.suggestionService.findAllByGoal(goalId)).map(
      (suggestion) => ({
        ...suggestion,
        suggestedAmount: suggestion.suggestedAmount
          ? Number(suggestion.suggestedAmount)
          : undefined,
      }),
    )
  }
}
