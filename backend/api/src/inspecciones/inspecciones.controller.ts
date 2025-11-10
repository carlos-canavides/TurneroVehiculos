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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { InspeccionesService } from './inspecciones.service';
import { CrearInspeccionDto } from './dto/crear-inspeccion.dto';
import { AgregarPuntajeDto } from './dto/agregar-puntaje.dto';
import { FinalizarInspeccionDto } from './dto/finalizar-inspeccion.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('inspecciones')
@ApiBearerAuth('JWT-auth')
@Controller('inspecciones')
@UseGuards(JwtAuthGuard)
export class InspeccionesController {
  constructor(private readonly service: InspeccionesService) {}

  @ApiOperation({ summary: 'Crear una nueva inspección (solo INSPECTOR)' })
  @ApiResponse({ status: 201, description: 'Inspección creada exitosamente' })
  @ApiResponse({ status: 400, description: 'Turno no confirmado o ya tiene inspección' })
  @Post()
  @UseGuards(RolesGuard)
  @Roles('INSPECTOR')
  crear(@Req() req: any, @Body() dto: CrearInspeccionDto) {
    return this.service.crear(req.user.userId, dto);
  }

  @ApiOperation({ summary: 'Agregar puntaje a un ítem (solo INSPECTOR)' })
  @ApiResponse({ status: 200, description: 'Puntaje agregado/actualizado' })
  @ApiResponse({ status: 404, description: 'Inspección o ítem no encontrado' })
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

  @ApiOperation({ summary: 'Finalizar inspección y evaluar resultado (solo INSPECTOR)' })
  @ApiResponse({ status: 200, description: 'Inspección finalizada con resultado evaluado' })
  @ApiResponse({ status: 400, description: 'Debe tener 8 puntajes para finalizar' })
  @Patch(':id/finalizar')
  @UseGuards(RolesGuard)
  @Roles('INSPECTOR')
  finalizar(@Req() req: any, @Param('id') id: string, @Body() dto: FinalizarInspeccionDto) {
    return this.service.finalizar(req.user.userId, id, dto);
  }

  @ApiOperation({ summary: 'Obtener inspección por ID' })
  @ApiResponse({ status: 200, description: 'Inspección encontrada' })
  @ApiResponse({ status: 404, description: 'Inspección no encontrada' })
  @Get(':id')
  obtenerPorId(@Param('id') id: string) {
    return this.service.obtenerPorId(id);
  }

  @ApiOperation({ summary: 'Listar mis inspecciones (solo INSPECTOR)' })
  @ApiResponse({ status: 200, description: 'Lista de inspecciones del inspector' })
  @Get('mias')
  @UseGuards(RolesGuard)
  @Roles('INSPECTOR')
  misInspecciones(@Req() req: any) {
    return this.service.listarPorInspector(req.user.userId);
  }

  @ApiOperation({ summary: 'Obtener inspección por turno' })
  @ApiResponse({ status: 200, description: 'Inspección del turno' })
  @ApiResponse({ status: 404, description: 'Turno no encontrado' })
  @Get('turno/:turnoId')
  obtenerPorTurno(@Param('turnoId') turnoId: string) {
    return this.service.listarPorTurno(turnoId);
  }

  @ApiOperation({ summary: 'Obtener todas las inspecciones (solo ADMIN)' })
  @ApiResponse({ status: 200, description: 'Lista de todas las inspecciones' })
  @Get('todas')
  todasLasInspecciones() {
    return this.service.todasLasInspecciones();
  }
}

