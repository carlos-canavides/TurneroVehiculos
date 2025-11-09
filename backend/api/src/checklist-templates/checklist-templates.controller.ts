import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ChecklistTemplatesService } from './checklist-templates.service';
import { CreateChecklistTemplateDto } from './dto/create-checklist-template.dto';
import { AddItemDto } from './dto/add-item.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('checklist-templates')
@ApiBearerAuth('JWT-auth')
@Controller('checklist-templates')
@UseGuards(JwtAuthGuard)
export class ChecklistTemplatesController {
  constructor(private readonly service: ChecklistTemplatesService) {}

  @ApiOperation({ summary: 'Crear nueva plantilla de checklist (solo ADMIN)' })
  @ApiResponse({ status: 201, description: 'Plantilla creada exitosamente' })
  @ApiResponse({ status: 409, description: 'Ya existe una plantilla con ese nombre' })
  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  crear(@Body() dto: CreateChecklistTemplateDto) {
    return this.service.crear(dto);
  }

  @ApiOperation({ summary: 'Agregar ítem a plantilla (solo ADMIN)' })
  @ApiResponse({ status: 201, description: 'Ítem agregado exitosamente' })
  @ApiResponse({ status: 400, description: 'La plantilla ya tiene 8 ítems' })
  @Post(':id/items')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  agregarItem(@Param('id') id: string, @Body() dto: AddItemDto) {
    return this.service.agregarItem(id, dto);
  }

  @ApiOperation({ summary: 'Listar plantillas de checklist' })
  @ApiQuery({ name: 'activas', required: false, description: 'Filtrar por activas (true/false)' })
  @ApiResponse({ status: 200, description: 'Lista de plantillas' })
  @Get()
  listar(@Query('activas') activas?: string) {
    const soloActivas = activas === 'true' ? true : activas === 'false' ? false : undefined;
    return this.service.listar(soloActivas);
  }

  @ApiOperation({ summary: 'Obtener plantilla por ID' })
  @ApiResponse({ status: 200, description: 'Plantilla encontrada' })
  @ApiResponse({ status: 404, description: 'Plantilla no encontrada' })
  @Get(':id')
  obtenerPorId(@Param('id') id: string) {
    return this.service.obtenerPorId(id);
  }

  @ApiOperation({ summary: 'Actualizar plantilla (solo ADMIN)' })
  @ApiResponse({ status: 200, description: 'Plantilla actualizada' })
  @ApiResponse({ status: 400, description: 'No se puede activar sin 8 ítems' })
  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  actualizar(@Param('id') id: string, @Body() dto: UpdateTemplateDto) {
    return this.service.actualizar(id, dto);
  }

  @ApiOperation({ summary: 'Eliminar ítem de plantilla (solo ADMIN)' })
  @ApiResponse({ status: 200, description: 'Ítem eliminado' })
  @ApiResponse({ status: 404, description: 'Plantilla o ítem no encontrado' })
  @Delete(':templateId/items/:itemId')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  eliminarItem(@Param('templateId') templateId: string, @Param('itemId') itemId: string) {
    return this.service.eliminarItem(templateId, itemId);
  }
}

