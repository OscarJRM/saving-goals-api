import { Module } from '@nestjs/common'
import { MailerModule } from '@nestjs-modules/mailer'
import { MailService } from './mail.service'
import { CustomConfigModule } from 'src/global/config/config.module'
import { CustomConfigService } from 'src/global/config/config.service'
import { MailController } from './mail.controller'
import { join } from 'path'
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter'

@Module({
  imports: [
    MailerModule.forRootAsync({
      imports: [CustomConfigModule],
      inject: [CustomConfigService],
      useFactory: (configService: CustomConfigService) => ({
        transport: {
          service: 'gmail', // Usar el servicio de Gmail
          auth: {
            user: configService.env.GMAIL_USER, // Tu correo (ej: 'tuemail@gmail.com')
            pass: configService.env.GMAIL_PASSWORD, // Tu contraseña de aplicación (no la personal)
          },
        },
        defaults: {
          from: '"Nombre de tu App" <tuemail@gmail.com>', // Remitente por defecto
        },
        template: {
          dir: join(process.cwd(), 'src', 'services', 'mail', 'templates'),
          adapter: new HandlebarsAdapter(),
          options: {
            strict: true,
          },
        },
      }),
    }),
  ],
  providers: [MailService],
  exports: [MailService],
  controllers: [MailController],
})
export class MailModule {}
