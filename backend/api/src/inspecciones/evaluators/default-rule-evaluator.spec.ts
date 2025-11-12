import { Test, TestingModule } from '@nestjs/testing';
import { DefaultRuleEvaluator } from './default-rule-evaluator';
import { InspectionResult } from '@prisma/client';

describe('DefaultRuleEvaluator', () => {
  let evaluator: DefaultRuleEvaluator;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DefaultRuleEvaluator],
    }).compile();

    evaluator = module.get<DefaultRuleEvaluator>(DefaultRuleEvaluator);
  });

  it('debe retornar RECHECK si algún item tiene menos de 5 puntos', () => {
    const inspeccion = {
      total: 80,
      scores: [
        { value: 4 }, // Item crítico
        { value: 10 },
        { value: 10 },
        { value: 10 },
        { value: 10 },
        { value: 10 },
        { value: 10 },
        { value: 10 },
      ],
    };

    const resultado = evaluator.evaluar(inspeccion);
    expect(resultado).toBe(InspectionResult.RECHECK);
  });

  it('debe retornar SAFE si el total es >= 80 y no hay items críticos', () => {
    const inspeccion = {
      total: 80,
      scores: [
        { value: 10 },
        { value: 10 },
        { value: 10 },
        { value: 10 },
        { value: 10 },
        { value: 10 },
        { value: 10 },
        { value: 10 },
      ],
    };

    const resultado = evaluator.evaluar(inspeccion);
    expect(resultado).toBe(InspectionResult.SAFE);
  });

  it('debe retornar RECHECK si el total es < 40', () => {
    const inspeccion = {
      total: 35,
      scores: [
        { value: 5 },
        { value: 5 },
        { value: 5 },
        { value: 5 },
        { value: 5 },
        { value: 5 },
        { value: 5 },
        { value: 0 },
      ],
    };

    const resultado = evaluator.evaluar(inspeccion);
    expect(resultado).toBe(InspectionResult.RECHECK);
  });

  it('debe retornar RECHECK si está entre 40 y 80 sin items críticos', () => {
    const inspeccion = {
      total: 60,
      scores: [
        { value: 7 },
        { value: 7 },
        { value: 7 },
        { value: 7 },
        { value: 7 },
        { value: 7 },
        { value: 7 },
        { value: 7 },
      ],
    };

    const resultado = evaluator.evaluar(inspeccion);
    expect(resultado).toBe(InspectionResult.RECHECK);
  });
});

