import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class VehiculosService {
  constructor(private prisma: PrismaService) {}

  async crear(patente: string, ownerId: string, alias?: string) {
    const plate = patente.toUpperCase();

    const existe = await this.prisma.vehicle.findUnique({
      where: { plate },
    });
    if (existe) {
      throw new ConflictException('La patente ya está registrada');
    }

    return this.prisma.vehicle.create({
      data: {
        plate,
        alias,
        owner: { connect: { id: ownerId } },
      },
      include: { owner: true },
    });
  }

  async misVehiculos(ownerId: string) {
    return this.prisma.vehicle.findMany({
      where: { ownerId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async obtenerPropio(id: string, ownerId: string) {
    const v = await this.prisma.vehicle.findFirst({
      where: { id, ownerId },
    });
    if (!v) throw new NotFoundException('Vehículo no encontrado');
    return v;
  }

  async eliminarPropio(id: string, ownerId: string) {
    const v = await this.obtenerPropio(id, ownerId);
    
    // Verificar si tiene turnos asociados
    const turnos = await this.prisma.appointment.findMany({
      where: { vehicleId: v.id },
      select: { id: true, state: true, dateTime: true },
    });

    if (turnos.length > 0) {
      const turnosActivos = turnos.filter(t => t.state !== 'CANCELLED');
      if (turnosActivos.length > 0) {
        throw new BadRequestException(
          `No se puede eliminar el vehículo porque tiene ${turnosActivos.length} turno(s) activo(s). ` +
          `Debes cancelar todos los turnos antes de eliminar el vehículo.`
        );
      }
      // Si todos los turnos están cancelados, permitir eliminar
    }

    await this.prisma.vehicle.delete({ where: { id: v.id } });
    return { ok: true };
  }

  async todosLosVehiculos() {
    return this.prisma.vehicle.findMany({
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
