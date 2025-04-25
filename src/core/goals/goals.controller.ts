// src/modules/goals/goals.controller.ts
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
import { GoalsService } from './goals.service'
import { CreateGoalDto } from './dto/create-goal.dto'
import { UpdateGoalDto } from './dto/update-goal.dto'
import { GoalResponseDto } from './dto/goal-response.dto'
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger'
import { User } from 'src/common/decorators/user.decorator'
import { FilterGoalsDto } from './dto/filter-goal.dto'
import { Auth } from '../auth/decorators/auth.decorator'

@ApiTags('goals')
@ApiBearerAuth()
@Auth()
@Controller('goals')
export class GoalsController {
  constructor(private readonly goalsService: GoalsService) {}

  @Post()
  @ApiOperation({ summary: 'Crear una nueva meta de ahorro' })
  @ApiBody({
    type: CreateGoalDto,
    description: 'Datos de la meta a crear',
  })
  @ApiResponse({
    status: 201,
    description: 'Meta creada exitosamente',
    type: GoalResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  create(@User('id') userId: number, @Body() createGoalDto: CreateGoalDto) {
    return this.goalsService.create(userId, createGoalDto)
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todas las metas del usuario' })
  @ApiResponse({
    status: 200,
    description: 'Lista de metas obtenida',
    type: [GoalResponseDto],
  })
  findAll(@User('id') userId: number, @Query() filterDto: FilterGoalsDto) {
    return this.goalsService.findAll(userId, filterDto)
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una meta específica por ID' })
  @ApiResponse({
    status: 200,
    description: 'Meta encontrada',
    type: GoalResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Meta no encontrada' })
  findOne(
    @User('id') userId: number,
    @Param('id', ParseIntPipe) goalId: number,
  ) {
    return this.goalsService.findOne(userId, goalId)
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar una meta existente' })
  @ApiResponse({
    status: 200,
    description: 'Meta actualizada exitosamente',
    type: GoalResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Meta no encontrada' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  update(
    @User('id') userId: number,
    @Param('id', ParseIntPipe) goalId: number,
    @Body() updateGoalDto: UpdateGoalDto,
  ) {
    return this.goalsService.update(userId, goalId, updateGoalDto)
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una meta' })
  @ApiResponse({ status: 200, description: 'Meta eliminada exitosamente' })
  @ApiResponse({ status: 404, description: 'Meta no encontrada' })
  remove(
    @User('id') userId: number,
    @Param('id', ParseIntPipe) goalId: number,
  ): Promise<void> {
    return this.goalsService.remove(userId, goalId)
  }
}
