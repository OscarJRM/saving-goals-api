import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsPositive,
  IsDate,
  IsInt,
} from 'class-validator'
import { Type } from 'class-transformer'
import { ApiProperty } from '@nestjs/swagger'

export class CreateGoalDto {
  @ApiProperty({
    description: 'Nombre de la meta',
    example: 'Ahorro para vacaciones',
  })
  @IsNotEmpty()
  @IsString()
  name: string

  @ApiProperty({
    description: 'Metas de ahorro',
    example: 12345,
  })
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  targetAmount: number

  @ApiProperty({
    description: 'Fecha límite para alcanzar la meta',
    example: '2025-12-31',
  })
  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  deadline: Date

  @ApiProperty({
    description: 'Id de la categoria de la meta',
    example: 1,
  })
  @IsNotEmpty()
  @IsInt()
  categoryId: number
}
