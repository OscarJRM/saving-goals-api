import { Injectable } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'
import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator'
import { PrismaService } from 'src/global/prisma/prisma.service'

@ValidatorConstraint({ async: true })
@Injectable()
export class EntityExistsConstraint implements ValidatorConstraintInterface {
  constructor(private prisma: PrismaService) {}

  async validate(value: unknown, args: ValidationArguments): Promise<boolean> {
    if (value === null || value === undefined || value === '') {
      // Si el valor está vacío, permitimos que otras validaciones manejen el error
      return true
    }

    const { model, field = 'id' } = args.constraints[0]

    try {
      // @ts-expect-error - model is a string
      const entity = await this.prisma[model].findUnique({
        where: { [field]: value },
      })

      return !!entity // Retorna `false` si no existe, activando el mensaje de error
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error: unknown) {
      return false
    }
  }

  defaultMessage(args: ValidationArguments): string {
    const { model, field = 'id' } = args.constraints[0]
    return `${model} with ${field} ${args.value} does not exist`
  }
}

export function EntityExists(
  model: keyof PrismaClient,
  field: string = 'id',
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [{ model, field }],
      validator: EntityExistsConstraint,
    })
  }
}
