import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { VehiculosService } from './vehiculos.service';
import { CreateVehiculoDto } from './dto/create-vehiculo.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('vehiculos')
export class VehiculosController {
  constructor(private readonly vehiculos: VehiculosService) {}

  // Crea un vehículo para el usuario autenticado
  @Post()
  async crear(@Body() dto: CreateVehiculoDto, @Req() req: any) {
    console.log('Auth:', req.headers.authorization);
    console.log('User:', req.user);
    const userId = req.user.userId; // viene del JwtStrategy que mapea payload.sub a userId
    return this.vehiculos.crear(dto.patente, userId, dto.alias);
  }

  // Lista sólo los vehículos del usuario autenticado
  @Get('mios')
  async mios(@Req() req: any) {
    return this.vehiculos.misVehiculos(req.user.userId);
  }

  // Obtiene 1 vehículo del usuario autenticado
  @Get(':id')
  async ver(@Param('id') id: string, @Req() req: any) {
    return this.vehiculos.obtenerPropio(id, req.user.userId);
  }

  // Elimina 1 vehículo del usuario autenticado
  @Delete(':id')
  async eliminar(@Param('id') id: string, @Req() req: any) {
    return this.vehiculos.eliminarPropio(id, req.user.userId);
  }
}
