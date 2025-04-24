import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class SignInDto {
  @ApiProperty({
    description: 'The email of the user',
    example: 'sebas.herrera3152@gmail.com',
  })
  @IsNotEmpty({ message: 'email must not be empty' })
  @IsEmail({}, { message: 'email must be a valid email' })
  email: string

  @ApiProperty({
    description: 'The password of the user',
    example: '123456',
    minLength: 6,
    maxLength: 20,
  })
  @IsString({ message: 'password must be a string' })
  @Length(6, 20, { message: 'password must be between 4 and 20 characters' })
  password: string
}
