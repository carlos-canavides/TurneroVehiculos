import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InspeccionesService } from './inspecciones.service';
import { PrismaService } from '../prisma/prisma.service';
import { DefaultRuleEvaluator } from './evaluators/default-rule-evaluator';
import { InspectionResult } from '@prisma/client';

describe('InspeccionesService', () => {
  let service: InspeccionesService;
  let prismaService: jest.Mocked<PrismaService>;
  let ruleEvaluator: jest.Mocked<DefaultRuleEvaluator>;

  beforeEach(async () => {
    const mockPrismaService = {
      appointment: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      inspection: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      inspectionItemScore: {
        find: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    const mockRuleEvaluator = {
      evaluar: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InspeccionesService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: DefaultRuleEvaluator, useValue: mockRuleEvaluator },
      ],
    }).compile();

    service = module.get<InspeccionesService>(InspeccionesService);
    prismaService = module.get(PrismaService);
    ruleEvaluator = module.get(DefaultRuleEvaluator);
  });

  describe('crear', () => {
    it('debe crear una inspección para un turno confirmado', async () => {
      const turno = {
        id: 'turno-1',
        state: 'CONFIRMED',
        template: {
          id: 'template-1',
          items: [
            { id: 'item-1', ord: 1 },
            { id: 'item-2', ord: 2 },
            { id: 'item-3', ord: 3 },
            { id: 'item-4', ord: 4 },
            { id: 'item-5', ord: 5 },
            { id: 'item-6', ord: 6 },
            { id: 'item-7', ord: 7 },
            { id: 'item-8', ord: 8 },
          ],
        },
        inspection: null,
      };

      prismaService.appointment.findUnique.mockResolvedValue(turno as any);
      prismaService.inspection.create.mockResolvedValue({
        id: 'inspeccion-1',
        appointmentId: 'turno-1',
        inspectorId: 'inspector-1',
        total: 0,
        result: 'SAFE',
      } as any);

      const resultado = await service.crear('inspector-1', { turnoId: 'turno-1' });

      expect(resultado).toBeDefined();
      expect(prismaService.inspection.create).toHaveBeenCalled();
    });

    it('debe lanzar BadRequestException si el turno no está confirmado', async () => {
      prismaService.appointment.findUnique.mockResolvedValue({
        id: 'turno-1',
        state: 'PENDING',
      } as any);

      await expect(
        service.crear('inspector-1', { turnoId: 'turno-1' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe lanzar BadRequestException si la plantilla no tiene 8 items', async () => {
      prismaService.appointment.findUnique.mockResolvedValue({
        id: 'turno-1',
        state: 'CONFIRMED',
        template: {
          items: [{ id: 'item-1' }], // Solo 1 item
        },
      } as any);

      await expect(
        service.crear('inspector-1', { turnoId: 'turno-1' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('calcularTotal', () => {
    it('debe calcular la suma de todos los puntajes', async () => {
      const inspeccion = {
        id: 'inspeccion-1',
        scores: [
          { value: 10 },
          { value: 8 },
          { value: 9 },
          { value: 7 },
          { value: 10 },
          { value: 8 },
          { value: 9 },
          { value: 7 },
        ],
      };

      prismaService.inspection.findUnique.mockResolvedValue(inspeccion as any);
      prismaService.inspection.update.mockResolvedValue({
        ...inspeccion,
        total: 68,
      } as any);

      const total = await service.calcularTotal('inspeccion-1');

      expect(total).toBe(68);
      expect(prismaService.inspection.update).toHaveBeenCalledWith({
        where: { id: 'inspeccion-1' },
        data: { total: 68 },
      });
    });
  });

  describe('finalizar', () => {
    it('debe finalizar una inspección con 8 puntajes', async () => {
      const inspeccion = {
        id: 'inspeccion-1',
        inspectorId: 'inspector-1',
        scores: [
          { id: 'score-1', value: 10, item: { id: 'item-1' } },
          { id: 'score-2', value: 10, item: { id: 'item-2' } },
          { id: 'score-3', value: 10, item: { id: 'item-3' } },
          { id: 'score-4', value: 10, item: { id: 'item-4' } },
          { id: 'score-5', value: 10, item: { id: 'item-5' } },
          { id: 'score-6', value: 10, item: { id: 'item-6' } },
          { id: 'score-7', value: 10, item: { id: 'item-7' } },
          { id: 'score-8', value: 10, item: { id: 'item-8' } },
        ],
        appointment: {
          template: { items: [] },
        },
      };

      prismaService.inspection.findUnique.mockResolvedValue(inspeccion as any);
      ruleEvaluator.evaluar.mockReturnValue(InspectionResult.SAFE);
      prismaService.inspection.update.mockResolvedValue({
        ...inspeccion,
        result: InspectionResult.SAFE,
        total: 80,
      } as any);

      // Mock del cálculo de total
      jest.spyOn(service, 'calcularTotal').mockResolvedValue(80);

      const resultado = await service.finalizar('inspector-1', 'inspeccion-1', {
        observacionGeneral: 'Todo bien',
      });

      expect(resultado).toBeDefined();
      expect(ruleEvaluator.evaluar).toHaveBeenCalled();
    });

    it('debe lanzar BadRequestException si no tiene 8 puntajes', async () => {
      const inspeccion = {
        id: 'inspeccion-1',
        inspectorId: 'inspector-1',
        scores: [{ id: 'score-1', value: 10 }], // Solo 1 puntaje
      };

      prismaService.inspection.findUnique.mockResolvedValue(inspeccion as any);

      await expect(
        service.finalizar('inspector-1', 'inspeccion-1', {}),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe lanzar ForbiddenException si el inspector no es el dueño', async () => {
      const inspeccion = {
        id: 'inspeccion-1',
        inspectorId: 'inspector-1',
        scores: [],
      };

      prismaService.inspection.findUnique.mockResolvedValue(inspeccion as any);

      await expect(
        service.finalizar('inspector-2', 'inspeccion-1', {}),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});

