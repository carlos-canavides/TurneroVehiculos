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
import { ChecklistTemplatesService } from './checklist-templates.service';
import { CreateChecklistTemplateDto } from './dto/create-checklist-template.dto';
import { AddItemDto } from './dto/add-item.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('checklist-templates')
@UseGuards(JwtAuthGuard)
export class ChecklistTemplatesController {
  constructor(private readonly service: ChecklistTemplatesService) {}

  // Solo ADMIN puede crear plantillas
  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  crear(@Body() dto: CreateChecklistTemplateDto) {
    return this.service.crear(dto);
  }

  // Solo ADMIN puede agregar ítems
  @Post(':id/items')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  agregarItem(@Param('id') id: string, @Body() dto: AddItemDto) {
    return this.service.agregarItem(id, dto);
  }

  // Cualquier usuario autenticado puede listar
  @Get()
  listar(@Query('activas') activas?: string) {
    const soloActivas = activas === 'true' ? true : activas === 'false' ? false : undefined;
    return this.service.listar(soloActivas);
  }

  // Cualquier usuario autenticado puede ver una plantilla
  @Get(':id')
  obtenerPorId(@Param('id') id: string) {
    return this.service.obtenerPorId(id);
  }

  // Solo ADMIN puede actualizar
  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  actualizar(@Param('id') id: string, @Body() dto: UpdateTemplateDto) {
    return this.service.actualizar(id, dto);
  }

  // Solo ADMIN puede eliminar ítems
  @Delete(':templateId/items/:itemId')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  eliminarItem(@Param('templateId') templateId: string, @Param('itemId') itemId: string) {
    return this.service.eliminarItem(templateId, itemId);
  }
}

