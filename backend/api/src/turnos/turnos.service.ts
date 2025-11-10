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

  async todosLosTurnos() {
    return this.prisma.appointment.findMany({
      include: {
        vehicle: {
          select: {
            id: true,
            plate: true,
            alias: true,
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        requester: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        inspector: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        inspection: {
          select: {
            id: true,
            total: true,
            result: true,
          },
        },
      },
      orderBy: {
        dateTime: 'desc',
      },
    });
  }

  async turnosConfirmadosDisponibles() {
    // Obtener turnos confirmados que no tienen inspección
    return this.prisma.appointment.findMany({
      where: {
        state: 'CONFIRMED',
        inspection: null, // No tiene inspección aún
      },
      include: {
        vehicle: {
          select: {
            id: true,
            plate: true,
            alias: true,
          },
        },
        requester: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        template: {
          include: {
            items: {
              orderBy: { ord: 'asc' },
            },
          },
        },
      },
      orderBy: {
        dateTime: 'asc',
      },
    });
  }

  async disponibilidad(fechaInicio?: string, fechaFin?: string) {
    // Generar horarios disponibles para los próximos 30 días
    const hoy = new Date();
    const fechaFinDefault = new Date();
    fechaFinDefault.setDate(fechaFinDefault.getDate() + 30);

    const inicio = fechaInicio ? new Date(fechaInicio) : hoy;
    const fin = fechaFin ? new Date(fechaFin) : fechaFinDefault;

    // Obtener turnos ya ocupados (CONFIRMED o PENDING)
    const turnosOcupados = await this.prisma.appointment.findMany({
      where: {
        dateTime: {
          gte: inicio,
          lte: fin,
        },
        state: {
          in: ['PENDING', 'CONFIRMED'],
        },
      },
      select: {
        dateTime: true,
      },
    });

    // Generar horarios disponibles (cada hora, de 9:00 a 17:00, lunes a viernes)
    const horariosDisponibles: Date[] = [];
    const fechaActual = new Date(inicio);

    while (fechaActual <= fin) {
      const diaSemana = fechaActual.getDay(); // 0 = domingo, 6 = sábado
      
      // Solo lunes a viernes (1-5)
      if (diaSemana >= 1 && diaSemana <= 5) {
        for (let hora = 9; hora <= 17; hora++) {
          const horario = new Date(fechaActual);
          horario.setHours(hora, 0, 0, 0);
          
          // Verificar que no esté ocupado
          const estaOcupado = turnosOcupados.some(
            (turno) => turno.dateTime.getTime() === horario.getTime(),
          );
          
          if (!estaOcupado && horario >= hoy) {
            horariosDisponibles.push(horario);
          }
        }
      }
      
      fechaActual.setDate(fechaActual.getDate() + 1);
    }

    return {
      horariosDisponibles: horariosDisponibles.map((h) => h.toISOString()),
      total: horariosDisponibles.length,
    };
  }
}