import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { TurnosService } from './turnos.service';
import { PrismaService } from '../prisma/prisma.service';

describe('TurnosService', () => {
  let service: TurnosService;
  let prismaService: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const mockPrismaService = {
      vehicle: {
        findFirst: jest.fn(),
      },
      checklistTemplate: {
        findFirst: jest.fn(),
      },
      appointment: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TurnosService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<TurnosService>(TurnosService);
    prismaService = module.get(PrismaService);
  });

  describe('validarHorario', () => {
    it('debe aceptar un horario válido (lunes a viernes, 9-17, hora redonda)', () => {
      // Lunes 10:00
      const fechaValida = new Date('2024-01-15T10:00:00');
      const esValido = (service as any).validarHorario(fechaValida);
      expect(esValido).toBe(true);
    });

    it('debe rechazar horarios fuera del rango 9-17', () => {
      const fechaInvalida = new Date('2024-01-15T08:00:00'); // 8:00
      const esValido = (service as any).validarHorario(fechaInvalida);
      expect(esValido).toBe(false);
    });

    it('debe rechazar horarios que no sean hora redonda', () => {
      const fechaInvalida = new Date('2024-01-15T10:30:00'); // 10:30
      const esValido = (service as any).validarHorario(fechaInvalida);
      expect(esValido).toBe(false);
    });

    it('debe rechazar fines de semana', () => {
      const fechaInvalida = new Date('2024-01-13T10:00:00'); // Sábado
      const esValido = (service as any).validarHorario(fechaInvalida);
      expect(esValido).toBe(false);
    });
  });

  describe('crear', () => {
    it('debe crear un turno con datos válidos', async () => {
      const fechaFutura = new Date();
      fechaFutura.setDate(fechaFutura.getDate() + 1);
      fechaFutura.setHours(10, 0, 0, 0);

      prismaService.vehicle.findFirst.mockResolvedValue({
        id: 'vehicle-1',
        ownerId: 'user-1',
      } as any);

      prismaService.checklistTemplate.findFirst.mockResolvedValue({
        id: 'template-1',
        active: true,
      } as any);

      prismaService.appointment.create.mockResolvedValue({
        id: 'turno-1',
        vehicleId: 'vehicle-1',
        dateTime: fechaFutura,
      } as any);

      const resultado = await service.crear('user-1', {
        vehicleId: 'vehicle-1',
        scheduledAt: fechaFutura.toISOString(),
      });

      expect(resultado).toBeDefined();
      expect(prismaService.appointment.create).toHaveBeenCalled();
    });

    it('debe lanzar ForbiddenException si el vehículo no pertenece al usuario', async () => {
      prismaService.vehicle.findFirst.mockResolvedValue(null);

      const fechaFutura = new Date();
      fechaFutura.setDate(fechaFutura.getDate() + 1);
      fechaFutura.setHours(10, 0, 0, 0);

      await expect(
        service.crear('user-1', {
          vehicleId: 'vehicle-1',
          scheduledAt: fechaFutura.toISOString(),
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('debe lanzar BadRequestException si la fecha es en el pasado', async () => {
      prismaService.vehicle.findFirst.mockResolvedValue({
        id: 'vehicle-1',
        ownerId: 'user-1',
      } as any);

      const fechaPasada = new Date('2020-01-01T10:00:00');

      await expect(
        service.crear('user-1', {
          vehicleId: 'vehicle-1',
          scheduledAt: fechaPasada.toISOString(),
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe lanzar BadRequestException si no hay checklist activo', async () => {
      prismaService.vehicle.findFirst.mockResolvedValue({
        id: 'vehicle-1',
        ownerId: 'user-1',
      } as any);

      prismaService.checklistTemplate.findFirst.mockResolvedValue(null);

      const fechaFutura = new Date();
      fechaFutura.setDate(fechaFutura.getDate() + 1);
      fechaFutura.setHours(10, 0, 0, 0);

      await expect(
        service.crear('user-1', {
          vehicleId: 'vehicle-1',
          scheduledAt: fechaFutura.toISOString(),
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('confirmar', () => {
    it('debe confirmar un turno pendiente', async () => {
      prismaService.appointment.findUnique.mockResolvedValue({
        id: 'turno-1',
        state: 'PENDING',
      } as any);

      prismaService.appointment.update.mockResolvedValue({
        id: 'turno-1',
        state: 'CONFIRMED',
      } as any);

      const resultado = await service.confirmar('turno-1');
      expect(resultado.state).toBe('CONFIRMED');
    });
  });
});

