import { Controller, Get, Res } from '@nestjs/common'
import { ExcelService } from './excel.service'
import { Response } from 'express'

@Controller('excel')
export class ExcelController {
  constructor(private readonly excelService: ExcelService) {}

  // Descargar Excel generado
  @Get('download')
  async downloadExcel(@Res() res: Response) {
    const buffer = await this.excelService.generateExcel()

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    )
    res.setHeader('Content-Disposition', 'attachment; filename=reporte.xlsx')
    res.send(buffer)
  }
}
