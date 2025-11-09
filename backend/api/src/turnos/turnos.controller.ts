import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { TurnosService } from './turnos.service';
import { CreateTurnoDto } from './dto/create-turno.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('turnos')
@UseGuards(JwtAuthGuard)
export class TurnosController {
  constructor(private readonly service: TurnosService) {}

  @Post()
  create(@Req() req: any, @Body() dto: CreateTurnoDto) {
    return this.service.create(req.user.userId, dto);
  }

  @Get()
  mine(@Req() req: any) {
    return this.service.mine(req.user.userId);
  }

  @Patch(':id/cancelar')
  cancel(@Req() req: any, @Param('id') id: string) {
    return this.service.cancel(req.user.userId, id);
  }
}
