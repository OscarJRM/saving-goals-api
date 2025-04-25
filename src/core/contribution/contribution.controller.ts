import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
} from '@nestjs/common'
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger'
import { ContributionService } from './contribution.service'
import { Auth } from '../auth/decorators/auth.decorator'
import { ContributionResponseDto } from './dto/contribution-response.dto'
import { CreateContributionDto } from './dto/create-contribution.dto'
import { UpdateContributionDto } from './dto/update-contribution.dto'
import { User } from 'src/common/decorators/user.decorator'
import { type User as IUser } from '@prisma/client'

@ApiTags('contributions')
@ApiBearerAuth()
@Auth()
@Controller('contributions')
export class ContributionController {
  constructor(private readonly contributionService: ContributionService) {}

  @Get()
  @ApiOperation({ summary: 'Get all contributions' })
  @ApiResponse({
    status: 200,
    description: 'Returns all contributions',
    type: [ContributionResponseDto],
  })
  async findAll(@User() user: IUser) {
    return this.contributionService.findAll(user.id)
  }

  @Get('goal/:goalId')
  @ApiOperation({ summary: 'Get contributions by goal ID' })
  @ApiParam({ name: 'goalId', description: 'ID of the goal' })
  @ApiResponse({
    status: 200,
    description: 'Returns contributions for a specific goal',
    type: [ContributionResponseDto],
  })
  @ApiResponse({ status: 404, description: 'Goal not found' })
  async findByGoal(@Param('goalId', ParseIntPipe) goalId: number) {
    return this.contributionService.findByGoal(goalId)
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a contribution by ID' })
  @ApiParam({ name: 'id', description: 'ID of the contribution' })
  @ApiResponse({
    status: 200,
    description: 'Returns the contribution',
    type: ContributionResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Contribution not found' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.contributionService.findOne(id)
  }

  @Post()
  @ApiOperation({ summary: 'Create a new contribution' })
  @ApiBody({ type: CreateContributionDto })
  @ApiResponse({
    status: 201,
    description: 'The contribution has been successfully created',
    type: ContributionResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'Goal not found' })
  async create(@Body() createContributionDto: CreateContributionDto) {
    return this.contributionService.create(createContributionDto)
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a contribution' })
  @ApiParam({ name: 'id', description: 'ID of the contribution' })
  @ApiBody({ type: UpdateContributionDto })
  @ApiResponse({
    status: 200,
    description: 'The contribution has been successfully updated',
    type: ContributionResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'Contribution not found' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateContributionDto: UpdateContributionDto,
  ) {
    return this.contributionService.update(id, updateContributionDto)
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a contribution' })
  @ApiParam({ name: 'id', description: 'ID of the contribution' })
  @ApiResponse({
    status: 200,
    description: 'The contribution has been successfully deleted',
  })
  @ApiResponse({ status: 404, description: 'Contribution not found' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.contributionService.remove(id)
  }

  @Post('recalculate')
  @ApiOperation({
    summary: 'Recalculate weekly targets for all goals that need it',
  })
  @ApiResponse({
    status: 200,
    description: 'Weekly targets recalculated successfully',
  })
  async recalculateWeeklyTargets() {
    await this.contributionService.recalculateWeeklyTargets()
    return { message: 'Weekly targets recalculated successfully' }
  }

  @Post('detect-inactive')
  @ApiOperation({ summary: 'Detect inactive goals and mark them as at risk' })
  @ApiQuery({
    name: 'daysThreshold',
    required: false,
    description:
      'Number of days without contributions to consider a goal inactive',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Inactive goals detection completed',
  })
  async detectInactiveGoals(@Query('daysThreshold') daysThreshold?: number) {
    await this.contributionService.detectInactiveGoals(daysThreshold)
    return { message: 'Inactive goals detection completed' }
  }
}
