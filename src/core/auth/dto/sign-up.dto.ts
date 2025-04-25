import {
  IsDate,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Length,
} from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'
import { Type } from 'class-transformer'

export class SignUpDto {
  @ApiProperty({
    description: 'The first name of the user',
    minLength: 2,
    maxLength: 20,
    example: 'John',
  })
  @IsNotEmpty({ message: 'firstName must not be empty' })
  @IsString({ message: 'firstName must be a string' })
  @Length(2, 20, { message: 'firstName must be between 2 and 20 characters' })
  firstName: string

  @ApiProperty({
    description: 'The last name of the user',
    minLength: 2,
    maxLength: 20,
    example: 'Doe',
  })
  @IsNotEmpty({ message: 'lastName must not be empty' })
  @IsString({ message: 'lastName must be a string' })
  @Length(2, 20, { message: 'lastName must be between 2 and 20 characters' })
  lastName: string

  @ApiProperty({
    description: 'The email address of the user',
    example: 'john.doe@example.com',
  })
  @IsNotEmpty({ message: 'email must not be empty' })
  @IsEmail({}, { message: 'email must be a valid email' })
  email: string

  @ApiProperty({
    description: 'The password for the user account',
    minLength: 6,
    maxLength: 20,
    example: 'securePassword123',
  })
  @IsString({ message: 'password must be a string' })
  @Length(6, 20, { message: 'password must be between 4 and 20 characters' })
  password: string

  @IsUrl()
  @IsOptional()
  @ApiProperty({
    description: 'The profile picture URL of the user',
    example: 'https://example.com/profile.jpg',
    required: false,
  })
  profilePicture?: string

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'The gender of the user',
    example: 'Hombre',
    required: false,
  })
  gender?: string

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  @ApiProperty({
    description: 'The birth date of the user',
    example: '1990-01-01',
    required: false,
  })
  birthDate?: Date
}
