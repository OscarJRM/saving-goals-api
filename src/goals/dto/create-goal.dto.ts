import { IsNotEmpty, IsNumber, IsString, IsPositive, IsDate, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateGoalDto {

@IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  targetAmount: number;

  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  deadline: Date;

  @IsNotEmpty()
  @IsInt()
  categoryId: number;

}