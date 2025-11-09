import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { InspeccionesService } from './inspecciones.service';
import { CrearInspeccionDto } from './dto/crear-inspeccion.dto';
import { AgregarPuntajeDto } from './dto/agregar-puntaje.dto';
import { FinalizarInspeccionDto } from './dto/finalizar-inspeccion.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('inspecciones')
@UseGuards(JwtAuthGuard)
export class InspeccionesController {
  constructor(private readonly service: InspeccionesService) {}

  // Solo INSPECTOR puede crear inspecciones
  @Post()
  @UseGuards(RolesGuard)
  @Roles('INSPECTOR')
  crear(@Req() req: any, @Body() dto: CrearInspeccionDto) {
    return this.service.crear(req.user.userId, dto);
  }

  // Solo INSPECTOR puede agregar puntajes
  @Post(':id/puntajes')
  @UseGuards(RolesGuard)
  @Roles('INSPECTOR')
  agregarPuntaje(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: AgregarPuntajeDto,
  ) {
    return this.service.agregarPuntaje(req.user.userId, id, dto);
  }

  // Solo INSPECTOR puede finalizar inspecciones
  @Patch(':id/finalizar')
  @UseGuards(RolesGuard)
  @Roles('INSPECTOR')
  finalizar(@Req() req: any, @Param('id') id: string, @Body() dto: FinalizarInspeccionDto) {
    return this.service.finalizar(req.user.userId, id, dto);
  }

  // Cualquier usuario autenticado puede ver una inspección
  @Get(':id')
  obtenerPorId(@Param('id') id: string) {
    return this.service.obtenerPorId(id);
  }

  // Listar inspecciones del inspector autenticado
  @Get('mias')
  @UseGuards(RolesGuard)
  @Roles('INSPECTOR')
  misInspecciones(@Req() req: any) {
    return this.service.listarPorInspector(req.user.userId);
  }

  // Obtener inspección por turno (cualquier usuario autenticado)
  @Get('turno/:turnoId')
  obtenerPorTurno(@Param('turnoId') turnoId: string) {
    return this.service.listarPorTurno(turnoId);
  }
}

