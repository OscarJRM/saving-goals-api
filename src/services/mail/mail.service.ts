import { Injectable } from '@nestjs/common'
import { MailerService } from '@nestjs-modules/mailer'

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendTestEmail(to: string) {
    await this.mailerService.sendMail({
      to,
      subject: 'Correo de prueba desde NestJS + Gmail',
      template: 'welcome',
      context: {
        name: 'Usuario',
      },
    })
  }
}
