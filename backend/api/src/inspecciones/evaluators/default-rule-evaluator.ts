import { Injectable } from '@nestjs/common';
import { InspectionResult } from '@prisma/client';
import { IRuleEvaluator } from './rule-evaluator.interface';

@Injectable()
export class DefaultRuleEvaluator implements IRuleEvaluator {
  evaluar(inspeccion: { total: number; scores: Array<{ value: number }> }): InspectionResult {
    // Regla 1: Si cualquier ítem tiene menos de 5 puntos → RECHECK
    const tieneItemCritico = inspeccion.scores.some((score) => score.value < 5);
    if (tieneItemCritico) {
      return InspectionResult.RECHECK;
    }

    // Regla 2: Si el total es mayor o igual a 80 → SAFE
    if (inspeccion.total >= 80) {
      return InspectionResult.SAFE;
    }

    // Regla 3: Si el total es menor a 40 → RECHECK
    if (inspeccion.total < 40) {
      return InspectionResult.RECHECK;
    }

    // Si está entre 40 y 80 (inclusive), y no hay ítems críticos:
    // Por defecto, si está en el rango medio, podría ser RECHECK para ser conservador
    // O podríamos hacerlo SAFE si está >= 60. Por ahora, usemos RECHECK para el rango medio
    return InspectionResult.RECHECK;
  }
}

