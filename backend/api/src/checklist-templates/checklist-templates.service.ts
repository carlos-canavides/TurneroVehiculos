import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateChecklistTemplateDto } from './dto/create-checklist-template.dto';
import { AddItemDto } from './dto/add-item.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';

@Injectable()
export class ChecklistTemplatesService {
  constructor(private prisma: PrismaService) {}

  async crear(dto: CreateChecklistTemplateDto) {
    // Verificar que no exista otra plantilla activa con el mismo nombre
    const existente = await this.prisma.checklistTemplate.findFirst({
      where: { name: dto.name },
    });
    if (existente) {
      throw new ConflictException('Ya existe una plantilla con ese nombre');
    }

    return this.prisma.checklistTemplate.create({
      data: {
        name: dto.name,
        active: false, // Por defecto inactiva hasta tener 8 ítems
      },
      include: { items: { orderBy: { ord: 'asc' } } },
    });
  }

  async agregarItem(templateId: string, dto: AddItemDto) {
    // Verificar que la plantilla existe
    const template = await this.prisma.checklistTemplate.findUnique({
      where: { id: templateId },
      include: { items: true },
    });
    if (!template) {
      throw new NotFoundException('Plantilla no encontrada');
    }

    // Verificar que no haya más de 8 ítems
    if (template.items.length >= 8) {
      throw new BadRequestException('La plantilla ya tiene 8 ítems (máximo permitido)');
    }

    // Verificar que el orden no esté ocupado
    const ordenOcupado = template.items.some((item) => item.ord === dto.ord);
    if (ordenOcupado) {
      throw new ConflictException(`El orden ${dto.ord} ya está ocupado en esta plantilla`);
    }

    // Crear el ítem
    const item = await this.prisma.checklistItemDefinition.create({
      data: {
        templateId,
        label: dto.label,
        ord: dto.ord,
      },
    });

    // Si ahora tiene 8 ítems, se puede activar automáticamente
    const itemsActualizados = await this.prisma.checklistItemDefinition.count({
      where: { templateId },
    });

    if (itemsActualizados === 8 && !template.active) {
      await this.prisma.checklistTemplate.update({
        where: { id: templateId },
        data: { active: true },
      });
    }

    return item;
  }

  async listar(activas?: boolean) {
    const where: any = {};
    if (activas !== undefined) {
      where.active = activas;
    }

    return this.prisma.checklistTemplate.findMany({
      where,
      include: {
        items: {
          orderBy: { ord: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async obtenerPorId(id: string) {
    const template = await this.prisma.checklistTemplate.findUnique({
      where: { id },
      include: {
        items: {
          orderBy: { ord: 'asc' },
        },
      },
    });

    if (!template) {
      throw new NotFoundException('Plantilla no encontrada');
    }

    return template;
  }

  async actualizar(id: string, dto: UpdateTemplateDto) {
    const template = await this.prisma.checklistTemplate.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!template) {
      throw new NotFoundException('Plantilla no encontrada');
    }

    // Si se intenta activar, validar que tenga 8 ítems
    if (dto.active === true && template.items.length !== 8) {
      throw new BadRequestException(
        'No se puede activar una plantilla que no tenga exactamente 8 ítems',
      );
    }

    // Si se desactiva, verificar que no esté siendo usada en turnos futuros
    if (dto.active === false && template.active) {
      const turnosFuturos = await this.prisma.appointment.count({
        where: {
          templateId: id,
          dateTime: { gte: new Date() },
          state: { in: ['PENDING', 'CONFIRMED'] },
        },
      });

      if (turnosFuturos > 0) {
        throw new BadRequestException(
          'No se puede desactivar una plantilla que está siendo usada en turnos futuros',
        );
      }
    }

    return this.prisma.checklistTemplate.update({
      where: { id },
      data: dto,
      include: {
        items: {
          orderBy: { ord: 'asc' },
        },
      },
    });
  }

  async eliminarItem(templateId: string, itemId: string) {
    // Verificar que la plantilla existe
    const template = await this.prisma.checklistTemplate.findUnique({
      where: { id: templateId },
    });
    if (!template) {
      throw new NotFoundException('Plantilla no encontrada');
    }

    // Verificar que el ítem existe y pertenece a la plantilla
    const item = await this.prisma.checklistItemDefinition.findFirst({
      where: { id: itemId, templateId },
    });
    if (!item) {
      throw new NotFoundException('Ítem no encontrado en esta plantilla');
    }

    // Si la plantilla está activa, desactivarla antes de eliminar
    if (template.active) {
      await this.prisma.checklistTemplate.update({
        where: { id: templateId },
        data: { active: false },
      });
    }

    await this.prisma.checklistItemDefinition.delete({
      where: { id: itemId },
    });

    return { ok: true };
  }
}

