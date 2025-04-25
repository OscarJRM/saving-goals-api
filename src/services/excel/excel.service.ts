import { Injectable } from '@nestjs/common'
import * as XLSX from 'xlsx'

@Injectable()
export class ExcelService {
  generateExcel() {
    // Datos de ejemplo (pueden venir de una DB, API, etc.)
    const data = [
      { ID: 1, Nombre: 'Laptop', Precio: 1200 },
      { ID: 2, Nombre: 'Mouse', Precio: 25 },
    ]

    // Convertir JSON a hoja de cálculo
    const worksheet = XLSX.utils.json_to_sheet(data)

    // Crear un libro y añadir la hoja
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Productos')

    // Guardar en buffer (para enviar por HTTP)
    const excelBuffer = XLSX.write(workbook, {
      type: 'buffer',
      bookType: 'xlsx',
    })

    return excelBuffer
  }
}
