import { Injectable } from '@nestjs/common'
import puppeteer from 'puppeteer'
import { compile } from 'handlebars'
import * as fs from 'fs/promises'
import * as path from 'path'

@Injectable()
export class PdfService {
  private readonly templatePath = path.join(
    path.join(process.cwd(), 'src', 'services', 'pdf', 'templates'),
    'invoice.hbs',
  )

  async generatePDF(data: any): Promise<Buffer> {
    // 1. Cargar y compilar la plantilla
    const templateContent = await fs.readFile(this.templatePath, 'utf-8')
    const template = compile(templateContent)
    const html = template(data)

    // 2. Configurar Puppeteer
    const browser = await puppeteer.launch({
      headless: true, // Usar el modo headless
      args: ['--no-sandbox'], // Necesario en entornos Docker
    })
    const page = await browser.newPage()

    // 3. Generar PDF
    await page.setContent(html, { waitUntil: 'networkidle0' })
    const pdf = await page.pdf({
      format: 'A4',
      margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' },
      printBackground: true,
    })

    await browser.close()
    return Buffer.from(pdf)
  }
}
