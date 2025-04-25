import { Body, Controller, Post, Res } from '@nestjs/common'
import { PdfService } from './pdf.service'
import { Response } from 'express'

@Controller('pdf')
export class PdfController {
  constructor(private readonly pdfService: PdfService) {}

  @Post('get-test-pdf')
  async generatePDF(@Body() data: any, @Res() res: Response) {
    const pdf = await this.pdfService.generatePDF(data)

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename=factura.pdf',
    })

    res.send(pdf)
  }
}
