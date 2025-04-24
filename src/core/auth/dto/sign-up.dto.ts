import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator'

export class SignUpDto {
  @IsNotEmpty({ message: 'firstName must not be empty' })
  @IsString({ message: 'firstName must be a string' })
  @Length(2, 20, { message: 'firstName must be between 2 and 20 characters' })
  firstName: string

  @IsNotEmpty({ message: 'lastName must not be empty' })
  @IsString({ message: 'lastName must be a string' })
  @Length(2, 20, { message: 'lastName must be between 2 and 20 characters' })
  lastName: string

  @IsNotEmpty({ message: 'email must not be empty' })
  @IsEmail({}, { message: 'email must be a valid email' })
  email: string

  @IsString({ message: 'password must be a string' })
  @Length(6, 20, { message: 'password must be between 4 and 20 characters' })
  password: string
}
