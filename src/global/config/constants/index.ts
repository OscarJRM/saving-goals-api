import * as Joi from 'joi'
import { IConfig } from '../types'

export const config = (): { APP: IConfig } => ({
  APP: {
    PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
    DATABASE_URL: process.env.DATABASE_URL!,
    JWT_SECRET: process.env.JWT_SECRET!,
    GMAIL_USER: process.env.GMAIL_USER!,
    GMAIL_PASSWORD: process.env.GMAIL_PASSWORD!,
  },
})

export const configValidationSchema = Joi.object<IConfig>({
  PORT: Joi.number().default(3000),
  DATABASE_URL: Joi.string().required(),
  JWT_SECRET: Joi.string().required(),
  GMAIL_USER: Joi.string().email().required(),
  GMAIL_PASSWORD: Joi.string().required(),
})
