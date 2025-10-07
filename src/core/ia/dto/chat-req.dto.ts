import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator'
import { ContextDto } from './context.dto'
import { Type } from 'class-transformer'

export class ChatReqDto {
  @IsString()
  @IsNotEmpty()
  prompt: string

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ContextDto)
  context: ContextDto[] = []

  @IsString()
  @IsOptional()
  model = 'deepseek/deepseek-chat-v3.1:free'
}
