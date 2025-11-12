import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('users')
@ApiBearerAuth('JWT-auth')
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private users: UsersService) {}

  @ApiOperation({ summary: 'Obtener mi perfil' })
  @ApiResponse({ status: 200, description: 'Perfil del usuario' })
  @Get('me')
  async me(@Req() req: any) {
    const u = await this.users.findById(req.user.userId);
    if (!u) return null;
    const { password, ...rest } = u as any;
    return rest;
  }

  @ApiOperation({ summary: 'Obtener todos los usuarios (solo ADMIN)' })
  @ApiResponse({ status: 200, description: 'Lista de todos los usuarios' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Get('todos')
  async todos() {
    return this.users.findAll();
  }
}
