import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTurnoDto } from './dto/create-turno.dto';

@Injectable()
export class TurnosService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateTurnoDto) {
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

    // Nota: ajusta el nombre del campo de fecha según tu schema:
    // si tu columna es "fechaHora" o "dateTime", reemplaza scheduledAt: when por el nombre correcto.
    return this.prisma.appointment.create({
      data: {
        vehicleId: dto.vehicleId,
        requesterId: userId,
        dateTime: when,            // <- cambia la clave si en Prisma se llama distinto (ej: dateTime)
        templateId: template.id,
        // status lo dejamos al default del schema
      },
      include: { vehicle: true },
    });
    // Si tu enum de estado no tiene default, usa:
    // status: 'PENDING' as any
  }

  async mine(userId: string) {
    return this.prisma.appointment.findMany({
      where: { requesterId: userId },
      orderBy: { dateTime: 'desc' }, // ajusta al nombre real del campo de fecha
      include: { vehicle: true },
    });
  }

  async cancel(userId: string, id: string) {
    const appt = await this.prisma.appointment.findFirst({
      where: { id, requesterId: userId },
    });
    if (!appt) throw new NotFoundException('Turno no encontrado');

    return this.prisma.appointment.update({
      where: { id },
      data: { state: 'CANCELLED' as any },
    });
  }
}