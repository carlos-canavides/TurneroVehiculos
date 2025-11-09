import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTurnoDto } from './dto/create-turno.dto';

@Injectable()
export class TurnosService {
  constructor(private prisma: PrismaService) {}

  async crear(userId: string, dto: CreateTurnoDto) {
    // 1) Validar que el vehículo sea del usuario
    const vehicle = await this.prisma.vehicle.findFirst({
      where: { id: dto.vehicleId, ownerId: userId },
    });
    if (!vehicle) throw new ForbiddenException('El vehículo no te pertenece');

    // 2) Validar fecha futura
    const when = new Date(dto.scheduledAt);
    if (isNaN(when.getTime()) || when < new Date()) {
      throw new BadRequestException('Fecha/hora inválida o en el pasado');
    }

    // 3) Obtener checklist por defecto (el más reciente activo)
    const template = await this.prisma.checklistTemplate.findFirst({
      where: { active: true },
      orderBy: { createdAt: 'desc' },
    });
    if (!template) throw new BadRequestException('No hay checklist activo');

    return this.prisma.appointment.create({
      data: {
        vehicleId: dto.vehicleId,
        requesterId: userId,
        dateTime: when,
        templateId: template.id,
      },
      include: { vehicle: true },
    });
  }

  async misTurnos(userId: string) {
    return this.prisma.appointment.findMany({
      where: { requesterId: userId },
      orderBy: { dateTime: 'desc' },
      include: { vehicle: true },
    });
  }

  async confirmar(id: string) {
    const appt = await this.prisma.appointment.findUnique({
      where: { id },
    });
    if (!appt) throw new NotFoundException('Turno no encontrado');
    if (appt.state !== 'PENDING') {
      throw new BadRequestException('Solo se pueden confirmar turnos pendientes');
    }

    return this.prisma.appointment.update({
      where: { id },
      data: { state: 'CONFIRMED' },
    });
  }

  async cancelar(userId: string, id: string, motivo?: string) {
    const appt = await this.prisma.appointment.findFirst({
      where: { id, requesterId: userId },
    });
    if (!appt) throw new NotFoundException('Turno no encontrado');
    if (appt.state === 'CANCELLED') {
      throw new BadRequestException('El turno ya está cancelado');
    }

    return this.prisma.appointment.update({
      where: { id },
      data: {
        state: 'CANCELLED',
        cancelReason: motivo ?? null,
      },
    });
  }
}