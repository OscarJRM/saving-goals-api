import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator'
import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/global/prisma/prisma.service'
import { PrismaClient } from '@prisma/client'

@Injectable()
@ValidatorConstraint({ async: true })
export class IsUniqueConstraint implements ValidatorConstraintInterface {
  constructor(private readonly prisma: PrismaService) {}

  async validate(value: unknown, args: ValidationArguments) {
    if (value === null || value === undefined || value === '') {
      // Si el valor es vacío, permitimos que otras validaciones manejen el error
      return true
    }

    const [modelName, field] = args.constraints

    // @ts-expect-error - modelName is a string
    const existingEntity = await this.prisma[modelName].findMany({
      where: { [field]: value },
    })

    return existingEntity.length === 0
  }

  defaultMessage(args: ValidationArguments) {
    return `A ${args.constraints[0]} with this ${args.constraints[1]} already exists`
  }
}

export function IsUnique(
  modelName: keyof PrismaClient,
  field: string,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [modelName, field],
      validator: IsUniqueConstraint,
    })
  }
}
