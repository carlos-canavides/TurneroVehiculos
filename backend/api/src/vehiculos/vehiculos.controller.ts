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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { VehiculosService } from './vehiculos.service';
import { CreateVehiculoDto } from './dto/create-vehiculo.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('vehiculos')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('vehiculos')
export class VehiculosController {
  constructor(private readonly vehiculos: VehiculosService) {}

  @ApiOperation({ summary: 'Crear un nuevo vehículo' })
  @ApiResponse({ status: 201, description: 'Vehículo creado exitosamente' })
  @ApiResponse({ status: 409, description: 'La patente ya está registrada' })
  @Post()
  async crear(@Body() dto: CreateVehiculoDto, @Req() req: any) {
    console.log('Auth:', req.headers.authorization);
    console.log('User:', req.user);
    const userId = req.user.userId; // viene del JwtStrategy que mapea payload.sub a userId
    return this.vehiculos.crear(dto.patente, userId, dto.alias);
  }

  @ApiOperation({ summary: 'Listar mis vehículos' })
  @ApiResponse({ status: 200, description: 'Lista de vehículos del usuario' })
  @Get('mios')
  async mios(@Req() req: any) {
    return this.vehiculos.misVehiculos(req.user.userId);
  }

  @ApiOperation({ summary: 'Obtener todos los vehículos (solo ADMIN)' })
  @ApiResponse({ status: 200, description: 'Lista de todos los vehículos' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Get('todos')
  async todos() {
    return this.vehiculos.todosLosVehiculos();
  }

  @ApiOperation({ summary: 'Obtener un vehículo por ID' })
  @ApiResponse({ status: 200, description: 'Vehículo encontrado' })
  @ApiResponse({ status: 404, description: 'Vehículo no encontrado' })
  @Get(':id')
  async ver(@Param('id') id: string, @Req() req: any) {
    return this.vehiculos.obtenerPropio(id, req.user.userId);
  }

  @ApiOperation({ summary: 'Eliminar un vehículo' })
  @ApiResponse({ status: 200, description: 'Vehículo eliminado' })
  @ApiResponse({ status: 400, description: 'No se puede eliminar porque tiene turnos activos' })
  @ApiResponse({ status: 404, description: 'Vehículo no encontrado' })
  @Delete(':id')
  async eliminar(@Param('id') id: string, @Req() req: any) {
    return this.vehiculos.eliminarPropio(id, req.user.userId);
  }
}
