import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CrearInspeccionDto } from './dto/crear-inspeccion.dto';
import { AgregarPuntajeDto } from './dto/agregar-puntaje.dto';
import { FinalizarInspeccionDto } from './dto/finalizar-inspeccion.dto';
import { DefaultRuleEvaluator } from './evaluators/default-rule-evaluator';

@Injectable()
export class InspeccionesService {
  constructor(
    private prisma: PrismaService,
    private ruleEvaluator: DefaultRuleEvaluator,
  ) {}

  async crear(inspectorId: string, dto: CrearInspeccionDto) {
    // Validar que el turno existe y esta confirmado
    const turno = await this.prisma.appointment.findUnique({
      where: { id: dto.turnoId },
      include: {
        template: {
          include: { items: { orderBy: { ord: 'asc' } } },
        },
        inspection: true,
      },
    });

    if (!turno) {
      throw new NotFoundException('Turno no encontrado');
    }

    if (turno.state !== 'CONFIRMED') {
      throw new BadRequestException('El turno debe estar confirmado para crear una inspeccion');
    }

    // Validar que no exista ya una inspeccion para este turno
    if (turno.inspection) {
      throw new BadRequestException('Ya existe una inspeccion para este turno');
    }

    // Validar que el turno tenga una plantilla con 8 items
    if (!turno.template || turno.template.items.length !== 8) {
      throw new BadRequestException(
        'El turno debe tener una plantilla activa con 8 items para crear una inspeccion',
      );
    }

    // Crear la inspeccion (sin puntajes, total = 0, resultado pendiente)
    const inspeccion = await this.prisma.inspection.create({
      data: {
        appointmentId: dto.turnoId,
        inspectorId,
        total: 0,
        result: 'SAFE',
      },
      include: {
        appointment: {
          include: {
            template: {
              include: { items: { orderBy: { ord: 'asc' } } },
            },
          },
        },
        scores: true
      },
    });

    return inspeccion;
  }

  async agregarPuntaje(
    inspectorId: string,
    inspeccionId: string,
    dto: AgregarPuntajeDto,
  ) {
    // Validar que la inspeccion existe y pertenece al inspector
    const inspeccion = await this.prisma.inspection.findUnique({
      where: { id: inspeccionId },
      include: {
        appointment: {
          include: {
            template: {
              include: { items: true },
            },
          },
        },
        scores: true
      },
    });

    if (!inspeccion) {
      throw new NotFoundException('Inspeccion no encontrada');
    }

    if (inspeccion.inspectorId !== inspectorId) {
      throw new ForbiddenException('No tienes permisos para modificar esta inspeccion');
    }

    // Validar que el item pertenece a la plantilla del turno
    const itemExiste = inspeccion.appointment.template.items.some(
      (item) => item.id === dto.itemId,
    );
    if (!itemExiste) {
      throw new NotFoundException('El item no pertenece a la plantilla de este turno');
    }

    // 3) Verificar si ya existe un puntaje para este item (actualizar o crear)
    const puntajeExistente = inspeccion.scores.find((score) => score.itemId === dto.itemId);

    if (puntajeExistente) {
      // Actualizar puntaje existente
      const puntajeActualizado = await this.prisma.inspectionItemScore.update({
        where: { id: puntajeExistente.id },
        data: {
          value: dto.valor,
          note: dto.nota ?? null,
        },
      });

      // Recalcular total
      await this.calcularTotal(inspeccionId);

      return puntajeActualizado;
    } else {
      // Crear nuevo puntaje
      const nuevoPuntaje = await this.prisma.inspectionItemScore.create({
        data: {
          inspectionId: inspeccionId,
          itemId: dto.itemId,
          value: dto.valor,
          note: dto.nota ?? null,
        },
      });

      // Recalcular total
      await this.calcularTotal(inspeccionId);

      return nuevoPuntaje;
    }
  }

  async calcularTotal(inspeccionId: string): Promise<number> {
    const inspeccion = await this.prisma.inspection.findUnique({
      where: { id: inspeccionId },
      include: { scores: true },
    });

    if (!inspeccion) {
      throw new NotFoundException('Inspección no encontrada');
    }

    const total = inspeccion.scores.reduce((sum, score) => sum + score.value, 0);

    await this.prisma.inspection.update({
      where: { id: inspeccionId },
      data: { total },
    });

    return total;
  }

  async finalizar(
    inspectorId: string,
    inspeccionId: string,
    dto: FinalizarInspeccionDto,
  ) {
    // 1) Validar que la inspeccion existe y pertenece al inspector
    const inspeccion = await this.prisma.inspection.findUnique({
      where: { id: inspeccionId },
      include: {
        appointment: {
          include: {
            template: {
              include: { items: true },
            },
          },
        },
        scores: {
          include: { item: true },
        },
      },
    });

    if (!inspeccion) {
      throw new NotFoundException('Inspeccion no encontrada');
    }

    if (inspeccion.inspectorId !== inspectorId) {
      throw new ForbiddenException('No tienes permisos para finalizar esta inspeccion');
    }

    // 2) Validar que tenga los 8 puntajes
    if (inspeccion.scores.length !== 8) {
      throw new BadRequestException(
        `La inspeccion debe tener 8 puntajes. Actualmente tiene ${inspeccion.scores.length}`,
      );
    }

    // 3) Recalcular total (por si acaso)
    const total = await this.calcularTotal(inspeccionId);

    // 4) Evaluar resultado usando el RuleEvaluator
    const resultado = this.ruleEvaluator.evaluar({
      total,
      scores: inspeccion.scores.map((s) => ({ value: s.value })),
    });

    // 5) Actualizar la inspeccion con el resultado y la observacion general
    const inspeccionFinalizada = await this.prisma.inspection.update({
      where: { id: inspeccionId },
      data: {
        result: resultado,
        note: dto.observacionGeneral ?? null,
      },
      include: {
        appointment: {
          include: {
            vehicle: true,
            template: {
              include: { items: { orderBy: { ord: 'asc' } } },
            },
          },
        },
        scores: {
          include: { item: true },
          orderBy: { item: { ord: 'asc' } },
        },
        inspector: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return inspeccionFinalizada;
  }

  async obtenerPorId(inspeccionId: string) {
    const inspeccion = await this.prisma.inspection.findUnique({
      where: { id: inspeccionId },
      include: {
        appointment: {
          include: {
            vehicle: true,
            requester: {
              select: { id: true, name: true, email: true },
            },
            template: {
              include: { items: { orderBy: { ord: 'asc' } } },
            },
          },
        },
        scores: {
          include: { item: true },
          orderBy: { item: { ord: 'asc' } },
        },
        inspector: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!inspeccion) {
      throw new NotFoundException('Inspeccion no encontrada');
    }

    return inspeccion;
  }

  async listarPorInspector(inspectorId: string) {
    return this.prisma.inspection.findMany({
      where: { inspectorId },
      include: {
        appointment: {
          include: {
            vehicle: true,
            requester: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        scores: {
          include: { item: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async todasLasInspecciones() {
    return this.prisma.inspection.findMany({
      include: {
        appointment: {
          include: {
            vehicle: {
              include: {
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
          },
        },
        scores: {
          include: { item: true },
          orderBy: { item: { ord: 'asc' } },
        },
        inspector: {
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

  async listarPorTurno(turnoId: string) {
    const turno = await this.prisma.appointment.findUnique({
      where: { id: turnoId },
      include: {
        inspection: {
          include: {
            scores: {
              include: { item: true },
              orderBy: { item: { ord: 'asc' } },
            },
            inspector: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });

    if (!turno) {
      throw new NotFoundException('Turno no encontrado');
    }

    return turno.inspection;
  }
}