import { Controller, Get } from '@nestjs/common'
import { MailService } from './mail.service'

@Controller('mail')
export class MailController {
  constructor(private readonly mailService: MailService) {}

  @Get('send-test-email')
  async sendTestEmail() {
    await this.mailService.sendTestEmail('ericktpa1@gmail.com')
    return 'Correo enviado correctamente'
  }
}
