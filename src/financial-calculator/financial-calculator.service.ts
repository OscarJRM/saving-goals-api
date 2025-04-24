import { Injectable } from '@nestjs/common';

@Injectable()
export class FinancialCalculatorService {
    /**
   * Calcula el objetivo semanal inicial para una meta
   * @param targetAmount Monto objetivo total
   * @param deadline Fecha límite
   * @returns Cantidad semanal recomendada
   */
  calculateInitialWeeklyTarget(targetAmount: number, deadline: Date): number {
    const currentDate = new Date();
    const totalWeeks = this.getWeeksBetweenDates(currentDate, deadline);
    
    if (totalWeeks <= 0) {
      throw new Error('La fecha límite debe ser en el futuro');
    }
    
    return parseFloat((targetAmount / totalWeeks).toFixed(2));
  }
  
  /**
   * Calcula el objetivo semanal actualizado para una meta
   * @param targetAmount Monto objetivo total
   * @param currentAmount Monto actual ahorrado
   * @param deadline Fecha límite
   * @returns Cantidad semanal recomendada actualizada
   */
  calculateCurrentWeeklyTarget(targetAmount: number, currentAmount: number, deadline: Date): number {
    const currentDate = new Date();
    const remainingWeeks = this.getWeeksBetweenDates(currentDate, deadline);
    
    if (remainingWeeks <= 0) {
      return targetAmount - currentAmount; // Todo en una semana si ya se pasó el plazo
    }
    
    const remainingAmount = targetAmount - currentAmount;
    if (remainingAmount <= 0) {
      return 0; // Ya se alcanzó la meta
    }
    
    return parseFloat((remainingAmount / remainingWeeks).toFixed(2));
  }
  
  /**
   * Verifica si una meta está en riesgo
   * @param initialWeeklyTarget Objetivo semanal inicial
   * @param currentWeeklyTarget Objetivo semanal actual
   * @returns true si la meta está en riesgo
   */
  isGoalAtRisk(initialWeeklyTarget: number, currentWeeklyTarget: number): boolean {
    // Una meta está en riesgo si se necesita ahorrar más del doble del objetivo semanal inicial
    return currentWeeklyTarget > initialWeeklyTarget * 2;
  }
  
  /**
   * Calcula el progreso de una meta
   * @param currentAmount Monto actual ahorrado
   * @param targetAmount Monto objetivo
   * @returns Porcentaje de progreso (0-100)
   */
  calculateProgress(currentAmount: number, targetAmount: number): number {
    if (targetAmount <= 0) return 0;
    return Math.min(100, (currentAmount / targetAmount) * 100);
  }

  /**
   * Obtiene el número de semanas entre dos fechas
   * @param startDate Fecha inicial
   * @param endDate Fecha final
   * @returns Número de semanas (incluso parciales)
   */
  private getWeeksBetweenDates(startDate: Date, endDate: Date): number {
    const millisecondsPerWeek = 1000 * 60 * 60 * 24 * 7;
    const diffTime = endDate.getTime() - startDate.getTime();
    const diffWeeks = diffTime / millisecondsPerWeek;
    
    // Garantizar que siempre haya al menos 0.1 semanas para evitar divisiones por cero
    return Math.max(0.1, diffWeeks);
  }
}
