import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator'

export class SignInDto {
  @IsNotEmpty({ message: 'email must not be empty' })
  @IsEmail({}, { message: 'email must be a valid email' })
  email: string

  @IsString({ message: 'password must be a string' })
  @Length(6, 20, { message: 'password must be between 4 and 20 characters' })
  password: string
}
