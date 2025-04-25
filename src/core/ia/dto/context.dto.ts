import { IsEnum, IsNotEmpty, IsString } from 'class-validator'
import { MessageRole } from '../types/message-role'

export class ContextDto {
  @IsEnum(MessageRole)
  role: MessageRole

  @IsString()
  @IsNotEmpty()
  content: string
}
