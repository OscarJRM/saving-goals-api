// src/modules/goals/goals.controller.ts
import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  UseGuards, 
  Query,
  ParseIntPipe
} from '@nestjs/common';
import { GoalsService } from './goals.service';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';
import { GoalResponseDto } from './dto/goal-response.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { User } from 'src/utils/decorators/user.decorator';
import { FilterGoalsDto } from './dto/filter-goal.dto';

@ApiTags('goals')
@ApiBearerAuth()
// @UseGuards(JwtAuthGuard)
@Controller('goals')
export class GoalsController {
  constructor(private readonly goalsService: GoalsService) {}

  @Post()
  @ApiOperation({ summary: 'Crear una nueva meta de ahorro' })
  @ApiResponse({ status: 201, description: 'Meta creada exitosamente', type: GoalResponseDto })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  create(@User('id') userId: number, @Body() createGoalDto: CreateGoalDto): Promise<GoalResponseDto> {
    return this.goalsService.create(userId, createGoalDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todas las metas del usuario' })
  @ApiResponse({ status: 200, description: 'Lista de metas obtenida', type: [GoalResponseDto] })
  findAll(
    @User('id') userId: number,
    @Query() filterDto: FilterGoalsDto
  ): Promise<GoalResponseDto[]> {
    return this.goalsService.findAll(userId, filterDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una meta específica por ID' })
  @ApiResponse({ status: 200, description: 'Meta encontrada', type: GoalResponseDto })
  @ApiResponse({ status: 404, description: 'Meta no encontrada' })
  findOne(
    @User('id') userId: number,
    @Param('id', ParseIntPipe) goalId: number
  ): Promise<GoalResponseDto> {
    return this.goalsService.findOne(userId, goalId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar una meta existente' })
  @ApiResponse({ status: 200, description: 'Meta actualizada exitosamente', type: GoalResponseDto })
  @ApiResponse({ status: 404, description: 'Meta no encontrada' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  update(
    @User('id') userId: number,
    @Param('id', ParseIntPipe) goalId: number,
    @Body() updateGoalDto: UpdateGoalDto
  ): Promise<GoalResponseDto> {
    return this.goalsService.update(userId, goalId, updateGoalDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una meta' })
  @ApiResponse({ status: 200, description: 'Meta eliminada exitosamente' })
  @ApiResponse({ status: 404, description: 'Meta no encontrada' })
  remove(
    @User('id') userId: number,
    @Param('id', ParseIntPipe) goalId: number
  ): Promise<void> {
    return this.goalsService.remove(userId, goalId);
  }
}