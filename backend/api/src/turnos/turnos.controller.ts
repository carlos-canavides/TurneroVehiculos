import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { TurnosService } from './turnos.service';
import { CreateTurnoDto } from './dto/create-turno.dto';
import { CancelarTurnoDto } from './dto/cancelar-turno.dto';

@ApiTags('turnos')
@ApiBearerAuth('JWT-auth')
@Controller('turnos')
@UseGuards(JwtAuthGuard)
export class TurnosController {
  constructor(private readonly service: TurnosService) {}

  @ApiOperation({ summary: 'Crear un nuevo turno' })
  @ApiResponse({ status: 201, description: 'Turno creado exitosamente' })
  @ApiResponse({ status: 400, description: 'Fecha inválida o vehículo no pertenece al usuario' })
  @Post()
  create(@Req() req: any, @Body() dto: CreateTurnoDto) {
    return this.service.crear(req.user.userId, dto);
  }

  @ApiOperation({ summary: 'Listar mis turnos' })
  @ApiResponse({ status: 200, description: 'Lista de turnos del usuario' })
  @Get('mios')
  mine(@Req() req: any) {
    return this.service.misTurnos(req.user.userId);
  }

  @ApiOperation({ summary: 'Confirmar un turno' })
  @ApiResponse({ status: 200, description: 'Turno confirmado' })
  @ApiResponse({ status: 400, description: 'Solo se pueden confirmar turnos pendientes' })
  @Patch(':id/confirmar')
  confirmar(@Param('id') id: string) {
    return this.service.confirmar(id);
  }

  @ApiOperation({ summary: 'Cancelar un turno' })
  @ApiResponse({ status: 200, description: 'Turno cancelado' })
  @ApiResponse({ status: 404, description: 'Turno no encontrado' })
  @Patch(':id/cancelar')
  cancelar(@Req() req: any, @Param('id') id: string, @Body() dto: CancelarTurnoDto) {
    return this.service.cancelar(req.user.userId, id, dto.motivo);
  }

  @ApiOperation({ summary: 'Consultar disponibilidad de turnos' })
  @ApiResponse({ status: 200, description: 'Lista de horarios disponibles' })
  @Get('disponibilidad')
  disponibilidad(@Req() req: any) {
    return this.service.disponibilidad();
  }

  @ApiOperation({ summary: 'Obtener turnos confirmados disponibles para inspección' })
  @ApiResponse({ status: 200, description: 'Lista de turnos confirmados sin inspección' })
  @Get('confirmados-disponibles')
  turnosConfirmadosDisponibles() {
    return this.service.turnosConfirmadosDisponibles();
  }

  @ApiOperation({ summary: 'Obtener todos los turnos (solo ADMIN)' })
  @ApiResponse({ status: 200, description: 'Lista de todos los turnos' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Get('todos')
  todosLosTurnos() {
    return this.service.todosLosTurnos();
  }

}