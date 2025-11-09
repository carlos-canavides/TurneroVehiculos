import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TurnosService } from './turnos.service';
import { CreateTurnoDto } from './dto/create-turno.dto';
import { CancelarTurnoDto } from './dto/cancelar-turno.dto';

@Controller('turnos')
@UseGuards(JwtAuthGuard)
export class TurnosController {
  constructor(private readonly service: TurnosService) {}

  @Post()
  create(@Req() req: any, @Body() dto: CreateTurnoDto) {
    return this.service.crear(req.user.userId, dto);
  }

  @Get('mios')
  mine(@Req() req: any) {
    return this.service.misTurnos(req.user.userId);
  }

  @Patch(':id/confirmar')
  confirmar(@Param('id') id: string) {
    return this.service.confirmar(id);
  }

  @Patch(':id/cancelar')
  cancelar(@Req() req: any, @Param('id') id: string, @Body() dto: CancelarTurnoDto) {
    return this.service.cancelar(req.user.userId, id, dto.motivo);
  }

}