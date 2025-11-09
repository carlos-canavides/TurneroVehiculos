import { InspectionResult } from '@prisma/client';

export interface IRuleEvaluator {
  evaluar(inspeccion: {
    total: number;
    scores: Array<{ value: number }>;
  }): InspectionResult;
}

