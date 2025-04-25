import { Injectable } from '@nestjs/common'
import { GoalByStatus } from './interfaces/report'
import * as XLSX from 'xlsx'

@Injectable()
export class GoalReportCreatorService {
  generateGoalsReport(
    goals: GoalByStatus[],
    fileName: string = 'Goals_Report.xlsx',
  ) {
    // 1. Preparar los datos principales
    const mainData = goals.map((goal) => ({
      Categoría: goal.category.name,
      'Nombre Meta': goal.name,
      'Monto Objetivo': goal.targetAmount.toNumber(),
      'Fecha Límite': this.formatDate(goal.deadline),
      Estado: goal.status,
      'Objetivo Semanal Inicial': goal.initialWeeklyTarget?.toNumber(),
      'Objetivo Semanal Actual': goal.currentWeeklyTarget?.toNumber(),
      'Monto Actual': goal.currentAmount.toNumber(),
      'En Riesgo': goal.isAtRisk ? 'Sí' : 'No',
      'Última Recalculación': this.formatDate(goal.lastRecalculationDate),
      'Necesita Recalculación': goal.needsRecalculation ? 'Sí' : 'No',
      'Fecha Creación': this.formatDate(goal.createdAt),
      'Fecha Actualización': this.formatDate(goal.updatedAt),
    }))

    // 2. Crear el libro de trabajo
    const wb = XLSX.utils.book_new()

    // 3. Hoja principal con los datos de las metas
    const wsMain = XLSX.utils.json_to_sheet(mainData)
    XLSX.utils.book_append_sheet(wb, wsMain, 'Metas')

    // 4. Hoja adicional con contribuciones por meta
    const allContributions: any[] = []
    goals.forEach((goal) => {
      goal.contributions.forEach((contribution) => {
        allContributions.push({
          'Nombre Meta': goal.name,
          Monto: contribution.amount.toNumber(),
          'Fecha Contribución': this.formatDate(contribution.contributionDate),
          Notas: contribution.notes,
          'Fecha Creación': this.formatDate(contribution.createdAt),
        })
      })
    })

    if (allContributions.length > 0) {
      const wsContributions = XLSX.utils.json_to_sheet(allContributions)
      XLSX.utils.book_append_sheet(wb, wsContributions, 'Contribuciones')
    }

    // 5. Hoja de resumen por categoría
    const categoriesSummary: Record<
      string,
      { count: number; totalTarget: number; totalCurrent: number }
    > = {}

    goals.forEach((goal) => {
      const catName = goal.category.name
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (!categoriesSummary[catName]) {
        categoriesSummary[catName] = {
          count: 0,
          totalTarget: 0,
          totalCurrent: 0,
        }
      }

      categoriesSummary[catName].count++
      categoriesSummary[catName].totalTarget += goal.targetAmount.toNumber()
      categoriesSummary[catName].totalCurrent += goal.currentAmount.toNumber()
    })

    const summaryData = Object.keys(categoriesSummary).map((catName) => ({
      Categoría: catName,
      'Número de Metas': categoriesSummary[catName].count,
      'Monto Objetivo Total': categoriesSummary[catName].totalTarget,
      'Monto Actual Total': categoriesSummary[catName].totalCurrent,
      'Porcentaje Alcanzado':
        (
          (categoriesSummary[catName].totalCurrent /
            categoriesSummary[catName].totalTarget) *
          100
        ).toFixed(2) + '%',
    }))

    const wsSummary = XLSX.utils.json_to_sheet(summaryData)
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumen por Categoría')

    // 6. Generar el archivo Excel
    XLSX.writeFile(wb, fileName)
  }

  // Función auxiliar para formatear fechas
  formatDate(date: Date | null): string {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  }
}
