import { IsEnum, IsOptional } from 'class-validator';

export enum GoalStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  EXPIRED = 'expired',
}

export class FilterGoalsDto {
  @IsOptional()
  @IsEnum(GoalStatus)
  status?: GoalStatus;

  @IsOptional()
  categoryId?: number;
}