import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { VehiculosService } from './vehiculos.service';
import { PrismaService } from '../prisma/prisma.service';

describe('VehiculosService', () => {
  let service: VehiculosService;
  let prismaService: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const mockPrismaService = {
      vehicle: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
      },
      appointment: {
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VehiculosService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<VehiculosService>(VehiculosService);
    prismaService = module.get(PrismaService);
  });

  describe('crear', () => {
    it('debe crear un vehículo con patente en mayúsculas', async () => {
      prismaService.vehicle.findUnique.mockResolvedValue(null);
      prismaService.vehicle.create.mockResolvedValue({
        id: '1',
        plate: 'ABC123',
        alias: 'Mi Auto',
        ownerId: 'owner-1',
      } as any);

      const resultado = await service.crear('abc123', 'owner-1', 'Mi Auto');

      expect(prismaService.vehicle.findUnique).toHaveBeenCalledWith({
        where: { plate: 'ABC123' },
      });
      expect(resultado.plate).toBe('ABC123');
    });

    it('debe lanzar ConflictException si la patente ya existe', async () => {
      prismaService.vehicle.findUnique.mockResolvedValue({
        id: '1',
        plate: 'ABC123',
      } as any);

      await expect(service.crear('ABC123', 'owner-1')).rejects.toThrow(ConflictException);
    });
  });

  describe('misVehiculos', () => {
    it('debe retornar los vehículos del dueño', async () => {
      const vehiculos = [
        { id: '1', plate: 'ABC123', ownerId: 'owner-1' },
        { id: '2', plate: 'XYZ789', ownerId: 'owner-1' },
      ];

      prismaService.vehicle.findMany.mockResolvedValue(vehiculos as any);

      const resultado = await service.misVehiculos('owner-1');

      expect(resultado).toEqual(vehiculos);
      expect(prismaService.vehicle.findMany).toHaveBeenCalledWith({
        where: { ownerId: 'owner-1' },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('obtenerPropio', () => {
    it('debe retornar el vehículo si pertenece al dueño', async () => {
      const vehiculo = { id: '1', plate: 'ABC123', ownerId: 'owner-1' };
      prismaService.vehicle.findFirst.mockResolvedValue(vehiculo as any);

      const resultado = await service.obtenerPropio('1', 'owner-1');
      expect(resultado).toEqual(vehiculo);
    });

    it('debe lanzar NotFoundException si el vehículo no existe o no pertenece al dueño', async () => {
      prismaService.vehicle.findFirst.mockResolvedValue(null);

      await expect(service.obtenerPropio('1', 'owner-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('eliminarPropio', () => {
    it('debe eliminar el vehículo si no tiene turnos activos', async () => {
      const vehiculo = { id: '1', plate: 'ABC123', ownerId: 'owner-1' };
      prismaService.vehicle.findFirst.mockResolvedValue(vehiculo as any);
      prismaService.appointment.findMany.mockResolvedValue([]);
      prismaService.vehicle.delete.mockResolvedValue(vehiculo as any);

      const resultado = await service.eliminarPropio('1', 'owner-1');

      expect(resultado).toEqual({ ok: true });
      expect(prismaService.vehicle.delete).toHaveBeenCalled();
    });

    it('debe lanzar BadRequestException si tiene turnos activos', async () => {
      const vehiculo = { id: '1', plate: 'ABC123', ownerId: 'owner-1' };
      prismaService.vehicle.findFirst.mockResolvedValue(vehiculo as any);
      prismaService.appointment.findMany.mockResolvedValue([
        { id: 'turno-1', state: 'CONFIRMED', dateTime: new Date() },
      ] as any);

      await expect(service.eliminarPropio('1', 'owner-1')).rejects.toThrow(BadRequestException);
    });
  });
});

